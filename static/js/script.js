// Global variables
let isLoading = true;
let animationId;
let mouseX = 0;
let mouseY = 0;
let typingComplete = false;

// Loading screen with typing effect for "/vik"
function initLoadingScreen() {
    const terminalText = document.getElementById('terminalText');
    const progressFill = document.getElementById('progressFill');
    const loadingText = document.getElementById('loadingText');
    const loadingScreen = document.getElementById('loadingScreen');

    const text = '/vik';
    let index = 0;
    let progress = 0;

    const messages = [
        'INITIALIZING SYSTEM...',
        'LOADING PROFILE...',
        'ESTABLISHING SECURE CONNECTION...',
        'VERIFYING CREDENTIALS...',
        'LOADING CYBERSECURITY MODULES...',
        'SYSTEM READY - WELCOME TO /vik'
    ];

    function typeText() {
        if (index < text.length) {
            terminalText.textContent += text.charAt(index);
            index++;
            setTimeout(typeText, 200); // Slower typing for effect
        } else {
            typingComplete = true;
            // Start progress animation after typing completes
            setTimeout(updateProgress, 500);
        }
    }

    function updateProgress() {
        if (progress <= 100) {
            progressFill.style.width = progress + '%';
            
            // Update loading message
            const messageIndex = Math.floor(progress / 20);
            if (messageIndex < messages.length) {
                loadingText.textContent = messages[messageIndex];
            }
            
            progress += 2;
            
            if (progress <= 100) {
                setTimeout(updateProgress, 50);
            } else {
                // Hide loading screen after completion
                setTimeout(() => {
                    loadingScreen.classList.add('fade-out');
                    isLoading = false;
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                        // Start hero typewriter after loading screen fully hidden
                        try { initHeroTypewriter(); } catch (e) { /* no-op if function missing */ }
                    }, 500);
                }, 500);
            }
        }
    }

    // Start typing animation
    setTimeout(typeText, 800);
}

// Particle wave effect for loading screen
function initParticleWave() {
    const canvas = document.getElementById('particleWave');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let time = 0;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function Particle(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = Math.sin(x * 0.01) * 2;
        this.color = Math.random() > 0.7 ? '#ff073a' : (Math.random() > 0.5 ? '#00ffff' : '#00ff41');
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.005;
    }

    function createWaveParticles() {
        for (let x = 0; x < canvas.width; x += 20) {
            if (Math.random() > 0.8) {
                const y = canvas.height / 2 + Math.sin((x + time) * 0.01) * 100;
                particles.push(new Particle(x, y));
            }
        }
    }

    function animateWave() {
        if (isLoading) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Update time
            time += 2;
            
            // Create new particles
            createWaveParticles();
            
            // Update and draw particles
            particles = particles.filter(particle => {
                particle.x += particle.speedX;
                particle.y += particle.speedY + Math.sin((particle.x + time) * 0.01) * 0.5;
                particle.life -= particle.decay;
                
                if (particle.life > 0) {
                    ctx.save();
                    ctx.globalAlpha = particle.life;
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fillStyle = particle.color;
                    ctx.fill();
                    
                    // Add trailing effect
                    ctx.beginPath();
                    ctx.arc(particle.x - particle.speedX * 5, particle.y - particle.speedY * 5, particle.size * 0.5, 0, Math.PI * 2);
                    ctx.globalAlpha = particle.life * 0.5;
                    ctx.fill();
                    ctx.restore();
                    
                    return true;
                }
                return false;
            });
            
            requestAnimationFrame(animateWave);
        }
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animateWave();
}

// Particle network effect
function initParticleNetwork() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let particles = [];
    let mousePos = { x: 0, y: 0 };

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function Particle() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
    }

    Particle.prototype.update = function() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
        if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;
    };

    Particle.prototype.draw = function() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 243, 255, 0.6)';
        ctx.fill();
    };

    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 243, 255, ${0.2 - distance / 500})`;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        connectParticles();
        
        if (!isLoading) {
            requestAnimationFrame(animate);
        }
    }

    // Initialize particles
    for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
    }

    // Event listeners
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', (e) => {
        mousePos.x = e.clientX;
        mousePos.y = e.clientY;
    });

    resizeCanvas();
    animate();
}

// Navigation functionality
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');

    // Smooth scrolling
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
            
            // Close mobile menu
            navMenu.classList.remove('active');
        });
    });

    // Mobile menu toggle
    mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Active section highlighting
    function updateActiveSection() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`a[href="#${sectionId}"]`);

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (navLink) navLink.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveSection);
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Animate skill bars
                if (entry.target.closest('#skills')) {
                    animateSkillBars();
                }
                
                // Animate counters
                if (entry.target.closest('#about')) {
                    animateCounters();
                }
            }
        });
    }, observerOptions);

    // Observe all animation elements
    document.querySelectorAll('.fade-in, .slide-left, .slide-right').forEach(el => {
        observer.observe(el);
    });
}

// Animate skill bars
function animateSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');
    
    skillBars.forEach((bar, index) => {
        const width = bar.getAttribute('data-width');
        setTimeout(() => {
            bar.style.width = width + '%';
        }, index * 100);
    });
}

// Animate counters
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const increment = target / 100;
        let count = 0;
        
        const updateCounter = () => {
            if (count < target) {
                count += increment;
                counter.textContent = Math.floor(count) + '+';
                setTimeout(updateCounter, 20);
            } else {
                counter.textContent = target + '+';
            }
        };
        
        updateCounter();
    });
}

// Project filtering
function initProjectFiltering() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            
            // Update active filter button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter projects
            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 100);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// Back to top button
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Hero section typewriter effect: types "/VIK SAMANTA", backspaces to "/VI", then retypes in a loop.
function initHeroTypewriter() {
    const el = document.querySelector('.hero-title.typewriter');
    if (!el) return;

    const fullText = './vik Samanta';
    const minKeep = 1; // keep '/VI' (/, V, I)
    const typingSpeed = 120; // ms per char
    const deletingSpeed = 60; // ms per char
    const pauseAfterFull = 1200; // ms pause when full text reached
    const pauseAfterDelete = 800; // ms pause when reduced to minKeep

    // Respect reduced-motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.textContent = fullText;
        return;
    }

    let pos = minKeep; // start from '/VI' visible
    let deleting = false;
    let timer = null;

    // Initialize display to '/VI'
    el.textContent = fullText.slice(0, minKeep);

    function step() {
        if (!deleting) {
            if (pos < fullText.length) {
                pos++;
                el.textContent = fullText.slice(0, pos);
                timer = setTimeout(step, typingSpeed + Math.floor(Math.random() * 60));
            } else {
                // Full text displayed — pause then start deleting
                timer = setTimeout(() => {
                    deleting = true;
                    step();
                }, pauseAfterFull);
            }
        } else {
            if (pos > minKeep) {
                pos--;
                el.textContent = fullText.slice(0, pos);
                timer = setTimeout(step, deletingSpeed + Math.floor(Math.random() * 40));
            } else {
                // Reached '/VI' — pause then start typing again
                timer = setTimeout(() => {
                    deleting = false;
                    step();
                }, pauseAfterDelete);
            }
        }
    }

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        if (timer) clearTimeout(timer);
    });

    // Kick off the loop with a short delay so loading screen can finish
    setTimeout(step, 700);
}

// Floating geometric shapes for hero section
function initGeometricShapes() {
    const container = document.getElementById('geometricShapes');
    if (!container) return;
    
    const shapes = ['hexagon', 'triangle', 'cube'];
    const colors = ['var(--accent-cyan)', 'var(--accent-green)', 'var(--accent-red)'];
    
    for (let i = 0; i < 25; i++) {
        const shape = document.createElement('div');
        const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        shape.className = `shape ${shapeType}`;
        shape.style.left = Math.random() * 100 + '%';
        shape.style.top = Math.random() * 100 + '%';
        shape.style.animationDuration = (Math.random() * 10 + 8) + 's';
        shape.style.animationDelay = Math.random() * 5 + 's';
        
        if (shapeType === 'hexagon' || shapeType === 'cube') {
            shape.style.borderColor = color;
        } else {
            shape.style.borderBottomColor = color;
        }
        
        // Add glow effect
        shape.style.filter = `drop-shadow(0 0 10px ${color})`;
        
        container.appendChild(shape);
    }
}

// Wave particles for timeline section
function initWaveParticles() {
    const canvas = document.getElementById('waveParticles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let time = 0;

    function resizeCanvas() {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
    }

    function createHorizontalWave() {
        const colors = ['#00ffff', '#00ff41', '#ff073a'];
        
        for (let i = 0; i < 3; i++) {
            for (let x = -50; x < canvas.width + 50; x += 15) {
                if (Math.random() > 0.7) {
                    particles.push({
                        x: x,
                        y: canvas.height / 2 + Math.sin((x + time + i * 100) * 0.02) * 50 + (i - 1) * 80,
                        size: Math.random() * 2 + 1,
                        color: colors[i],
                        life: 1,
                        layer: i
                    });
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        time += 1;
        
        // Create new wave particles
        if (time % 20 === 0) {
            createHorizontalWave();
        }
        
        // Update particles
        particles = particles.filter(particle => {
            particle.x += 2 + particle.layer * 0.5;
            particle.y += Math.sin((particle.x + time) * 0.02) * 0.5;
            particle.life -= 0.01;
            
            if (particle.life > 0 && particle.x < canvas.width + 50) {
                ctx.save();
                ctx.globalAlpha = particle.life;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.fill();
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.restore();
                return true;
            }
            return false;
        });
        
        requestAnimationFrame(animate);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Start animation when section is visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animate();
                observer.unobserve(entry.target);
            }
        });
    });
    
    observer.observe(canvas.parentElement);
}

// Interactive particles for contact section
function initInteractiveParticles() {
    const canvas = document.getElementById('interactiveParticles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: 0, y: 0 };

    function resizeCanvas() {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
    }

    function Particle() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 3 + 1;
        this.color = ['#00ffff', '#00ff41', '#ff073a'][Math.floor(Math.random() * 3)];
        this.originalX = this.x;
        this.originalY = this.y;
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < 100; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((particle, i) => {
            // Mouse interaction
            const dx = mouse.x - particle.x;
            const dy = mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const force = (120 - distance) / 120;
            
            if (distance < 120) {
                particle.vx -= (dx / distance) * force * 0.1;
                particle.vy -= (dy / distance) * force * 0.1;
            }
            
            // Return to original position
            particle.vx += (particle.originalX - particle.x) * 0.01;
            particle.vy += (particle.originalY - particle.y) * 0.01;
            
            // Apply velocity with damping
            particle.vx *= 0.95;
            particle.vy *= 0.95;
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Draw particle
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = 0.8;
            ctx.fill();
            
            // Draw connections
            particles.forEach((otherParticle, j) => {
                if (i !== j) {
                    const dx2 = particle.x - otherParticle.x;
                    const dy2 = particle.y - otherParticle.y;
                    const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                    
                    if (distance2 < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        ctx.strokeStyle = particle.color;
                        ctx.globalAlpha = (100 - distance2) / 100 * 0.3;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            });
        });
        
        ctx.globalAlpha = 1;
        requestAnimationFrame(animate);
    }

    // Mouse tracking
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    resizeCanvas();
    initParticles();
    window.addEventListener('resize', () => {
        resizeCanvas();
        initParticles();
    });
    
    // Start animation when section is visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animate();
                observer.unobserve(entry.target);
            }
        });
    });
    
    observer.observe(canvas.parentElement);
}

// Initialize all functionality (NO CURSOR EFFECTS)
function init() {
    initLoadingScreen();
    initParticleWave();
    initParticleNetwork();
    initGeometricShapes();
    initWaveParticles();
    initInteractiveParticles();
    initNavigation();
    initScrollAnimations();
    initProjectFiltering();
    initBackToTop();
}

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', init);

// Handle window resize
window.addEventListener('resize', () => {
    // Recalculate particle canvas size
    const canvas = document.getElementById('particleCanvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
});
// Typewriter effect for ASCII art
document.addEventListener("DOMContentLoaded", () => {
  const asciiArt = `
                         ⢀⣀⣀⣀⣀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣴⣶⣿⣿⣿⣿⣿⠟⠉
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣿⣿⣿⣿⣿⣿⣇
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣶⡀⠈⣿⣿⣿⣿⣿⠟⠋
⠀⠀⠀⠀⠀⣀⣄⠀⠀⢿⣶⣾⣿⣿⣇⣼⣿⣿⣿⣿⡃
⠀⠀⢀⣰⣾⣿⣿⣷⣄⣈⣉⣿⣿⣿⣿⣿⣿⣿⣿⣿⠆
⠀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡅
⢀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣦
⢸⡟⠋⠉⠉⠙⠋⠀⠀⠉⠛⠋⠉⠛⠿⣿⡟⠻⠅⠈⠷⠆
⠘⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣧⠄    ⠈


⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣤⣤⣀⣠⣶⣤⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣶⡿⠟⠛⠉⠉⠉⠉⠉⠉⠛⠿⣝⡢⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⢞⡿⠋⢀⡴⢋⡀⠀⠀⠀⠀⠀⠀⠀⡈⠙⢮⣷⢤⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⢣⡟⠁⠀⠛⠴⠋⠀⠀⠀⠀⠀⠀⠀⠀⠈⠳⣄⠉⠙⠛⠛⠿⣶⣄⠀⠀⠀⢀⣀⡤⡤⢄⣀⠀⠀⠀⠀
⠀⣀⣠⣠⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⡿⠀⠀⠀⢀⣤⣤⣄⠀⠀⠀⢀⣤⣤⡀⠀⠀⠘⣶⣶⠾⠷⠶⠾⡿⠀⠀⡴⣻⠾⠋⠉⠻⣯⡳⡄⠀⠀
⢰⣿⠋⠙⠻⣝⢦⡀⠀⠀⠀⠀⠀⠀⢸⣿⠃⠀⠀⠀⣾⣿⣿⣿⡆⠀⢀⣾⣿⣿⣿⡆⠀⠀⢹⣿⠀⠀⠀⠀⠀⢠⣾⡿⠋⠀⠀⠀⠀⠈⢷⣱⡀⠀
⢸⣿⠀⠀⠀⠈⠳⣿⣦⡀⠀⠀⠀⠀⣿⡿⠀⠀⠀⠀⣿⣿⣿⣿⣷⠀⢸⣿⣿⣿⣿⣷⡀⠀⢸⣾⡄⠀⠀⠀⢀⣾⡟⠁⠀⠀⠀⢀⡀⠀⠈⣿⣧⠀
⠸⣿⡀⠀⠀⢠⠀⠈⠻⣿⣦⡀⠀⢸⣿⠇⠀⠀⢀⠀⢿⣿⣿⣿⡇⠀⠘⣿⣿⣿⣿⠇⢷⠀⠈⣿⢷⠀⠀⢀⣾⡿⠁⠀⠀⡖⠀⣾⠁⠀⠀⢹⣿⡀
⠀⢿⣧⠀⠀⠀⢧⠀⠀⠈⠳⣽⣶⣾⡟⠀⠀⢠⠏⡀⠈⠛⠛⠋⠀⠀⠀⠈⠻⠟⠋⠀⠘⣇⠀⠘⢯⣝⣶⣾⡿⠁⠀⠀⢸⠃⠀⡇⠀⠀⠀⠸⣿⡇
⠀⠈⢿⣇⠀⠀⠘⣇⠀⠀⠀⠀⠉⠉⠀⠀⣰⢏⡼⠁⠀⠀⠀⠀⢰⣿⣷⠀⠀⠀⠀⠀⠰⣌⠧⠀⠀⠈⠉⠁⠀⠀⠀⠀⡟⠀⠀⠀⠀⠀⠀⠀⣿⡇
⠀⠀⢸⣿⠀⠀⠀⢻⢀⡀⠀⠀⠀⠀⠀⠈⠁⠈⠀⠀⠀⠀⠀⠀⠘⠿⠟⠀⠀⠀⠀⠀⠀⠈⠁⠀⠀⠀⠀⠀⠀⠀⠀⢸⣇⣴⡶⣶⢶⣤⣀⠀⣿⡇
⠀⠀⢸⡿⠀⠀⠀⠘⡇⢧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⡟⠁⠀⢻⣷⣿⣿⣿⣿⠁
⠀⢠⣿⠇⠀⠀⠀⠀⠣⢸⡀⠘⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⢶⣄⣸⣿⣏⣿⣿⠿⠁
⠀⣼⡟⠀⠀⣀⣀⣀⡀⠀⣇⠀⠿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡄⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⡜⡇⠀⠀⠀
⠀⡏⣣⣴⣿⡿⢻⡏⠛⢿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⣼⡄⠀⠀
⠀⠹⣟⣿⢿⣿⣾⠀⠀⣠⣿⠂⠀⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡄⠀⠀⠀⠀⠀⡼⠀⠀⠀⢠⠇⠀⠀⠀⠀⢀⣴⡟⡼⠁⠀⠀
⠀⠀⠈⠉⣹⢻⣷⡶⠟⠋⠁⠀⡀⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⡴⠋⠀⠀⠀⠀⠀⠀⡇⠀⠀⠀⣸⣤⣶⣶⣶⣾⣛⡵⠚⠁⠀⠀⠀
⠀⠀⠀⠀⡻⣿⡁⠀⠀⠀⠀⢸⡇⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠉⠓⠒⠉⠁⠀⠀⣰⠃⠀⠀⠀⢸⠇⠀⠀⠀⣿⠏⠀⢾⡟⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠛⠿⢿⣿⣿⣶⣶⣾⡇⠀⠀⠀⡇⠀⠀⠀⠀⢆⠀⠀⠀⠀⠀⠀⠀⠀⣴⠃⠀⠀⠀⠀⣸⠀⠀⠀⠀⢿⣆⡀⢸⣿⡀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣤⣿⠃⠀⠀⠀⡇⠀⠀⡄⠀⠈⠳⣄⠀⠀⠀⠀⣠⠞⠁⠀⢠⠃⠀⠀⣿⠀⠀⠀⠀⠀⠉⠛⢿⣿⡇⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣷⣿⠋⠁⠀⠀⠀⢸⡇⠀⠀⠸⡄⠀⠀⠈⠙⠒⠒⠋⠁⠀⠀⠀⡞⠀⠀⠀⣿⠀⠀⠀⠀⠀⣀⣠⣼⢿⡇⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢯⣟⡷⢶⣤⣤⣀⢸⡇⠀⠀⠀⢣⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⠃⠀⠀⠀⣿⠾⠛⢻⣿⠿⠭⠿⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠙⢳⣿⠙⣿⠃⠀⠀⠀⠸⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⡾⠀⠀⠀⠀⠻⢷⣤⣼⣯⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⣿⡾⠛⠀⠀⠀⠀⠀⣧⠀⠀⠀⠀⠀⠀⠀⠀⢠⡇⠀⠀⠀⠀⠀⠀⠙⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣟⠀⠀⠀⠀⠀⠀⠀⣿⠀⠀⠀⠀⠀⠀⠀⠀⢸⡃⣀⣀⠀⠀⠀⠀⣠⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⣿⣷⠦⣤⣤⠤⠤⣤⣿⣄⡀⠀⠀⠀⠀⠀⠀⢼⡟⠛⣿⣿⠿⠶⠾⠿⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠉⠉⠉⠉⠛⢿⡿⣷⡀⠀⠀⠀⠀⠈⠻⣾⣿⠆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣾⣷⠀⠀⠀⠀⠀⠀⢹⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣟⡟⠀⠀⠀⠀⠀⣠⡿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢨⣿⡇⠀⠀⠀⢀⡾⢻⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣏⣧⠀⠀⠀⣾⣱⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢮⣷⣄⣸⣷⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀


HAPPY HALLOWEEN 2025!
`;

  const asciiElement = document.getElementById("asciiArt");
  let index = 0;

  function typeWriter() {
    if (index < asciiArt.length) {
      asciiElement.textContent += asciiArt.charAt(index);
      index++;
      setTimeout(typeWriter, 1); // adjust speed
    }
  }

  typeWriter();
});

