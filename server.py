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

from flask import Flask, request, send_from_directory, abort, make_response

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
STATIC_FOLDER = '.'
LOG_FILE = 'admin_access.log'

ADMIN_USER = os.getenv('ADMIN_USER', 'admin')
ADMIN_PW_HASH_RAW = os.getenv('ADMIN_PW_HASH', None)  # expected bcrypt hash string
FLASK_PORT = int(os.getenv('FLASK_PORT', '3000'))

# Convert ADMIN_PW_HASH to bytes if provided
ADMIN_PW_HASH = ADMIN_PW_HASH_RAW.encode('utf-8') if ADMIN_PW_HASH_RAW else None

# Rate limiting / lockout parameters (tweak as needed)
LOCKOUT_THRESHOLD = int(os.getenv('LOCKOUT_THRESHOLD', '5'))
LOCKOUT_PERIOD = int(os.getenv('LOCKOUT_PERIOD', '300'))   # seconds
RATE_LIMIT_WINDOW = int(os.getenv('RATE_LIMIT_WINDOW', '60'))  # seconds
RATE_LIMIT_MAX = int(os.getenv('RATE_LIMIT_MAX', '15'))

# -------------------------------
# App & logging
# -------------------------------
app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path='')
logging.basicConfig(filename=LOG_FILE, level=logging.INFO,
                    format='%(asctime)s %(levelname)s %(message)s')

# In-memory stores (demo only)
failed_attempts = {}
lockouts = {}
rate_windows = {}

# -------------------------------
# Helpers
# -------------------------------
def client_ip():
    """Return best-effort client IP (honors X-Forwarded-For if present)."""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
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
        logging.warning(f"LOCKOUT set for {ip} until {lockouts[ip]}")

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
        if ADMIN_PW_HASH is None:
            return False
        return bcrypt.checkpw(plain_password.encode('utf-8'), ADMIN_PW_HASH)
    except Exception:
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
            logging.warning(f"RATE_LIMIT {ip} path={request.path}")
            return make_response("Too many requests. Slow down.", 429)

        # Lockout check
        if is_locked(ip):
            logging.warning(f"LOCKED_ATTEMPT {ip} path={request.path}")
            return make_response("Temporarily blocked due to repeated failed attempts.", 403)

        auth = request.authorization
        if not auth:
            resp = make_response('Authentication required', 401)
            resp.headers['WWW-Authenticate'] = 'Basic realm="Admin Area"'
            return resp

        username_ok = hmac.compare_digest(auth.username or '', ADMIN_USER)
        password_ok = check_password(auth.password or '')

        if username_ok and password_ok:
            logging.info(f"ADMIN_LOGIN_SUCCESS ip={ip} user={auth.username} path={request.path}")
            # reset failed attempts for this ip
            if ip in failed_attempts:
                del failed_attempts[ip]
            return view_func(*args, **kwargs)
        else:
            logging.warning(f"ADMIN_LOGIN_FAIL ip={ip} user={auth.username} path={request.path}")
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
    return send_from_directory(STATIC_FOLDER, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # basic sanitization
    if '..' in path or path.startswith('/'):
        abort(400)

    # explicit index mapping (single-page)
    if path in ('', 'index.html'):
        return send_from_directory(STATIC_FOLDER, 'index.html')

    # single-page: any other .html request is bad
    if path.endswith('.html') and path != 'index.html':
        abort(400)

    # serve file if exists
    if os.path.exists(os.path.join(STATIC_FOLDER, path)):
        return send_from_directory(STATIC_FOLDER, path)

    abort(404)

@app.route('/favicon.ico')
def favicon():
    if os.path.exists(os.path.join(STATIC_FOLDER, 'favicon.ico')):
        return send_from_directory(STATIC_FOLDER, 'favicon.ico')
    abort(404)

@app.route('/admin')
@require_basic_auth
def admin_page():
    return send_from_directory(STATIC_FOLDER, 'admin.html')

@app.route('/secret-honeypot')
def honeypot():
    ip = client_ip()
    ua = request.headers.get('User-Agent', '')
    logging.warning(f"HONEYPOT_HIT ip={ip} ua={ua} path={request.path}")
    return ("<h1>Access Denied</h1><p>This area is monitored.</p>", 403)

# -------------------------------
# Error handlers
# -------------------------------
@app.errorhandler(400)
def bad_request(e):
    return send_from_directory(STATIC_FOLDER, '400.html'), 400

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(STATIC_FOLDER, '404.html'), 404

@app.errorhandler(429)
def too_many(e):
    return ("Too many requests", 429)

@app.errorhandler(500)
def internal_error(e):
    return send_from_directory(STATIC_FOLDER, '500.html'), 500

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

    # Bind to all network interfaces
    app.run(host='0.0.0.0', port=FLASK_PORT, debug=True)

