#!/usr/bin/env python3
"""
server.py

Flask static-site server with /admin protected by Basic Auth.
Admin username & bcrypt hash are read from a local .env file (recommended).

Usage:
  - Generate a bcrypt hash for a password:
      python server.py --gen-hash "YourStrongPassword"
    Copy the printed hash into your .env as ADMIN_PW_HASH.

  - Run the server:
      python server.py

Requirements:
  pip install flask bcrypt python-dotenv
"""

import os
import time
import socket
import logging
import argparse
import hmac
from functools import wraps
from typing import Optional

from flask import (
    Flask,
    request,
    send_from_directory,
    abort,
    make_response,
    render_template,
)
from werkzeug.utils import safe_join

# third-party libs
import bcrypt
from dotenv import load_dotenv

# -------------------------------
# Load .env (project root)
# -------------------------------
load_dotenv()  # load environment variables from .env

# -------------------------------
# Configuration (from .env or defaults)
# -------------------------------
# Expect a standard Flask layout:
#  - static files in ./static
#  - HTML templates in ./templates
STATIC_FOLDER = os.getenv('STATIC_FOLDER', 'static')
TEMPLATE_FOLDER = os.getenv('TEMPLATE_FOLDER', 'templates')
LOG_FILE = os.getenv('LOG_FILE', 'admin_access.log')

ADMIN_USER = os.getenv('ADMIN_USER', 'admin')
ADMIN_PW_HASH_RAW = os.getenv('ADMIN_PW_HASH', None)  # expected bcrypt hash string
FLASK_PORT = int(os.getenv('FLASK_PORT', '3000'))

# Convert ADMIN_PW_HASH to bytes if provided
ADMIN_PW_HASH: Optional[bytes] = ADMIN_PW_HASH_RAW.encode('utf-8') if ADMIN_PW_HASH_RAW else None

# Rate limiting / lockout parameters (tweak as needed)
LOCKOUT_THRESHOLD = int(os.getenv('LOCKOUT_THRESHOLD', '5'))
LOCKOUT_PERIOD = int(os.getenv('LOCKOUT_PERIOD', '300'))   # seconds
RATE_LIMIT_WINDOW = int(os.getenv('RATE_LIMIT_WINDOW', '60'))  # seconds
RATE_LIMIT_MAX = int(os.getenv('RATE_LIMIT_MAX', '15'))

# -------------------------------
# App & logging
# -------------------------------
app = Flask(__name__, static_folder=STATIC_FOLDER, template_folder=TEMPLATE_FOLDER)

# Logging both to file and console
logger = logging.getLogger('server')
logger.setLevel(logging.INFO)
file_handler = logging.FileHandler(LOG_FILE)
file_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
stream_handler = logging.StreamHandler()
stream_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
logger.addHandler(file_handler)
logger.addHandler(stream_handler)

# In-memory stores (demo only) - OK for small single-process deployments
failed_attempts = {}
lockouts = {}
rate_windows = {}

# -------------------------------
# Helpers
# -------------------------------
def client_ip():
    """Return best-effort client IP (honors X-Forwarded-For if present)."""
    xff = request.headers.get('X-Forwarded-For')
    if xff:
        return xff.split(',')[0].strip()
    return request.remote_addr or 'unknown'

def is_locked(ip):
    expiry = lockouts.get(ip)
    if expiry:
        if time.time() < expiry:
            return True
        # expired — remove
        del lockouts[ip]
    return False

def record_failed(ip):
    now = time.time()
    lst = failed_attempts.setdefault(ip, [])
    lst.append(now)
    # trim history
    if len(lst) > LOCKOUT_THRESHOLD * 2:
        failed_attempts[ip] = lst[-(LOCKOUT_THRESHOLD * 2):]
    # check recent attempts and lock if threshold reached
    recent = [t for t in failed_attempts[ip] if now - t < LOCKOUT_PERIOD]
    if len(recent) >= LOCKOUT_THRESHOLD:
        lockouts[ip] = now + LOCKOUT_PERIOD
        logger.warning(f"LOCKOUT set for {ip} until {lockouts[ip]}")

def rate_limit_ok(ip):
    now = time.time()
    window = rate_windows.setdefault(ip, [])
    window.append(now)
    # keep only timestamps within window
    window[:] = [t for t in window if now - t <= RATE_LIMIT_WINDOW]
    return len(window) <= RATE_LIMIT_MAX

def check_password(plain_password: str) -> bool:
    """Return True if plain_password matches ADMIN_PW_HASH (bcrypt)."""
    try:
        if ADMIN_PW_HASH is None or plain_password is None:
            return False
        return bcrypt.checkpw(plain_password.encode('utf-8'), ADMIN_PW_HASH)
    except Exception as exc:
        logger.exception("Password check error")
        return False

# -------------------------------
# Authentication decorator
# -------------------------------
def require_basic_auth(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        ip = client_ip()

        # Rate-limit early
        if not rate_limit_ok(ip):
            logger.warning(f"RATE_LIMIT {ip} path={request.path}")
            return make_response("Too many requests. Slow down.", 429)

        # Lockout check
        if is_locked(ip):
            logger.warning(f"LOCKED_ATTEMPT {ip} path={request.path}")
            return make_response("Temporarily blocked due to repeated failed attempts.", 403)

        auth = request.authorization
        if not auth:
            resp = make_response('Authentication required', 401)
            resp.headers['WWW-Authenticate'] = 'Basic realm="Admin Area"'
            return resp

        # Safe constant-time comparisons
        username_ok = hmac.compare_digest((auth.username or '').encode('utf-8'), ADMIN_USER.encode('utf-8'))
        password_ok = check_password(auth.password or '')

        if username_ok and password_ok:
            logger.info(f"ADMIN_LOGIN_SUCCESS ip={ip} user={auth.username} path={request.path}")
            # reset failed attempts for this ip
            failed_attempts.pop(ip, None)
            return view_func(*args, **kwargs)
        else:
            logger.warning(f"ADMIN_LOGIN_FAIL ip={ip} user={auth.username} path={request.path}")
            record_failed(ip)
            resp = make_response('Invalid credentials', 401)
            resp.headers['WWW-Authenticate'] = 'Basic realm="Admin Area"'
            return resp
    return wrapped

# -------------------------------
# Routes
# -------------------------------
@app.route('/')
def index():
    # Prefer templates/index.html so Jinja can be used if needed.
    try:
        return render_template('index.html')
    except Exception:
        # fallback: serve static index if template missing
        index_path = os.path.join(app.static_folder or STATIC_FOLDER, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(app.static_folder, 'index.html')
        abort(404)

@app.route('/favicon.ico')
def favicon():
    # serve from static/favicon/favicon.ico if present
    favicon_path = os.path.join(app.static_folder or STATIC_FOLDER, 'favicon', 'favicon.ico')
    if os.path.exists(favicon_path):
        return send_from_directory(os.path.join(app.static_folder, 'favicon'), 'favicon.ico')
    abort(404)

@app.route('/admin')
@require_basic_auth
def admin_page():
    # Admin HTML should be in templates/admin.html for proper separation.
    try:
        return render_template('admin.html')
    except Exception:
        # security: avoid serving arbitrary files; don't expose filesystem.
        abort(404)

@app.route('/secret-honeypot')
def honeypot():
    ip = client_ip()
    ua = request.headers.get('User-Agent', '')
    logger.warning(f"HONEYPOT_HIT ip={ip} ua={ua} path={request.path}")
    return ("<h1>Access Denied</h1><p>This area is monitored.</p>", 403)

# Serve static assets under /static/<path:...>
@app.route('/static/<path:filename>')
def static_files(filename):
    # Prevent directory traversal with safe_join
    try:
        # safe_join will raise if illegal
        safe_join(app.static_folder, filename)
    except Exception:
        abort(400)
    full_path = os.path.join(app.static_folder or STATIC_FOLDER, filename)
    if os.path.exists(full_path) and os.path.isfile(full_path):
        return send_from_directory(app.static_folder, filename)
    abort(404)

# Optional: serve specific top-level files (images, etc.) from project root safely
@app.route('/assets/<path:filename>')
def assets(filename):
    # map to static/assets if you want another alias -- safe_join to validate
    try:
        safe_join(app.static_folder, filename)
    except Exception:
        abort(400)
    full_path = os.path.join(app.static_folder or STATIC_FOLDER, filename)
    if os.path.exists(full_path) and os.path.isfile(full_path):
        return send_from_directory(app.static_folder, filename)
    abort(404)

# Generic catch-all for other top-level pages -- be strict
@app.route('/<path:path>')
def serve_other(path):
    # disallow serving arbitrary .html files from anywhere
    if '..' in path or path.startswith('/'):
        abort(400)
    # disallow direct .html except index/admin (handled above)
    if path.endswith('.html'):
        abort(400)
    # try to serve from static folder if exists
    candidate = os.path.join(app.static_folder or STATIC_FOLDER, path)
    if os.path.exists(candidate) and os.path.isfile(candidate):
        return send_from_directory(app.static_folder, path)
    abort(404)

# -------------------------------
# Error handlers
# -------------------------------
@app.errorhandler(400)
def bad_request(e):
    try:
        return render_template('400.html'), 400
    except Exception:
        return ("Bad request", 400)

@app.errorhandler(404)
def not_found(e):
    try:
        return render_template('404.html'), 404
    except Exception:
        return ("Not Found", 404)

@app.errorhandler(429)
def too_many(e):
    return ("Too many requests", 429)

@app.errorhandler(500)
def internal_error(e):
    try:
        return render_template('500.html'), 500
    except Exception:
        return ("Internal Server Error", 500)

# -------------------------------
# CLI helper: generate bcrypt hash
# -------------------------------
def generate_bcrypt_hash(password: str, rounds: int = 12) -> str:
    pw = password.encode('utf-8')
    hashed = bcrypt.hashpw(pw, bcrypt.gensalt(rounds))
    return hashed.decode('utf-8')

# -------------------------------
# Main & CLI
# -------------------------------
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Run Flask static server (admin protected via .env)")
    parser.add_argument('--gen-hash', metavar='"PASSWORD"', help='Generate bcrypt hash for PASSWORD and print it')
    parser.add_argument('--rounds', type=int, default=12, help='bcrypt salt rounds (default 12)')
    args = parser.parse_args()

    if args.gen_hash:
        print("BCRYPT HASH (copy this into .env as ADMIN_PW_HASH):")
        print(generate_bcrypt_hash(args.gen_hash, rounds=args.rounds))
        raise SystemExit(0)

    # ensure ADMIN_PW_HASH is configured
    if ADMIN_PW_HASH is None:
        print("ERROR: ADMIN_PW_HASH missing. Create a .env file with ADMIN_PW_HASH and optionally ADMIN_USER/FLASK_PORT.")
        print('Generate a hash: python server.py --gen-hash "YourStrongPassword"')
        raise SystemExit(1)

    # -------------------------------------------------------
    # Better IP detection (works on all OS & Wi-Fi/LAN)
    # -------------------------------------------------------
    def get_lan_ip():
        """Detect your local LAN IP (not loopback)."""
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(('8.8.8.8', 80))  # Google's DNS; no packets actually sent
            ip = s.getsockname()[0]
        except Exception:
            ip = '127.0.0.1'
        finally:
            s.close()
        return ip

    lan_ip = get_lan_ip()

    print("\nFlask is running and reachable at:")
    print(f"   • Localhost: http://127.0.0.1:{FLASK_PORT}")
    print(f"   • LAN IP:    http://{lan_ip}:{FLASK_PORT}")
    print("Admin path: /admin  |  Honeypot: /secret-honeypot\n")

    # Bind to all network interfaces. Turn debug off in production!
    app.run(host='0.0.0.0', port=FLASK_PORT, debug=True)
