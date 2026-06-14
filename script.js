/**
 * script.js — Dra. Daniela Delgado | Salud & Bienestar Integral
 * ──────────────────────────────────────────────────────────────
 * Modules:
 *   1. Config & utils
 *   2. Navbar (scroll shrink)
 *   3. Mobile Menu
 *   4. GSAP Hero entrance
 *   5. GSAP ScrollReveal
 *   6. Fluid Background (cursor parallax + touch)
 *   7. Contact Form
 */

'use strict';

/* ============================================================
   1. CONFIG
   ============================================================ */
const CONFIG = {
    REDUCED_MOTION: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
};

// Safe GSAP check — retries until CDN scripts are loaded
function withGSAP(cb, retries = 20) {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        cb();
    } else if (retries > 0) {
        setTimeout(() => withGSAP(cb, retries - 1), 80);
    } else {
        console.warn('[DD] GSAP could not be loaded.');
        // Fallback: reveal all elements instantly
        document.querySelectorAll('.reveal').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }
}

/* ============================================================
   2. NAVBAR — scroll shrink + active link highlight
   ============================================================ */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    // Scroll shrink
    const handleScroll = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Active section tracking via IntersectionObserver
    const sections = document.querySelectorAll('section[id], header[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    if (sections.length && navLinks.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    navLinks.forEach(link => {
                        const href = link.getAttribute('href');
                        link.classList.toggle('active', href === `#${id}`);
                    });
                }
            });
        }, { rootMargin: '-40% 0px -55% 0px' });

        sections.forEach(s => observer.observe(s));
    }
}

/* ============================================================
   3. MOBILE MENU
   ============================================================ */
function initMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('mobile-menu');
    if (!toggle || !menu) return;

    let isOpen = false;

    const openMenu = () => {
        isOpen = true;
        toggle.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
        menu.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
        isOpen = false;
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
        document.body.style.overflow = '';
    };

    toggle.addEventListener('click', () => isOpen ? closeMenu() : openMenu());

    // Close on link click
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

    // Close on Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && isOpen) closeMenu();
    });

    // Close on backdrop tap (mobile)
    menu.addEventListener('click', e => {
        if (e.target === menu) closeMenu();
    });
}

/* ============================================================
   4. GSAP BENTO HERO ENTRANCE
   ============================================================ */
function initHeroAnimation() {
    if (CONFIG.REDUCED_MOTION) {
        // Instantly reveal all bento cards
        document.querySelectorAll('.bento-card').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
        return;
    }

    withGSAP(() => {
        gsap.registerPlugin(ScrollTrigger);

        const tl = gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 0.15 });

        // 1. Navbar slides in
        tl.fromTo('#navbar',
            { opacity: 0, y: -24 },
            { opacity: 1, y: 0, duration: 0.6 }
        )
            // 2. Main bento card (big one) scales up from slightly smaller
            .fromTo('#bento-main',
                { opacity: 0, y: 30, scale: 0.96, force3D: true },
                { opacity: 1, y: 0, scale: 1, duration: 0.9 },
                '-=0.2'
            )
            // 3. Side cards stagger in from right (desktop) / bottom (mobile)
            .fromTo('#bento-results',
                { opacity: 0, y: 20, x: 10, force3D: true },
                { opacity: 1, y: 0, x: 0, duration: 0.6 },
                '-=0.55'
            )
            .fromTo('#bento-location',
                { opacity: 0, y: 20, x: 10, force3D: true },
                { opacity: 1, y: 0, x: 0, duration: 0.6 },
                '-=0.45'
            )
            .fromTo('#bento-social',
                { opacity: 0, y: 20, x: 10, force3D: true },
                { opacity: 1, y: 0, x: 0, duration: 0.6 },
                '-=0.42'
            )
            // 4. Decorative "1" fades in
            .fromTo('.hero-number',
                { opacity: 0, scale: 0.9 },
                { opacity: 0.04, scale: 1, duration: 1.5, ease: 'power2.out' },
                0.3
            );

        // Subtle parallax on the decorative number while scrolling
        gsap.to('.hero-number', {
            y: -60,
            ease: 'none',
            scrollTrigger: {
                trigger: '#inicio',
                start: 'top top',
                end: 'bottom top',
                scrub: 1.2,
            },
        });
    });
}

/* ============================================================
   8. BENTO CAROUSEL — auto-rotating results slides
   ============================================================ */
function initBentoCarousel() {
    const carousel = document.getElementById('results-carousel');
    const labelEl = document.getElementById('results-label');
    const dotsWrap = document.getElementById('results-dots');
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.rslide');
    const dots = dotsWrap?.querySelectorAll('.rdot');
    if (!slides.length) return;

    let current = 0;
    let timer = null;

    const goTo = (idx) => {
        // Deactivate current
        slides[current].classList.remove('rslide--active');
        dots?.[current].classList.remove('rdot--active');
        dots?.[current].setAttribute('aria-selected', 'false');

        // Activate new
        current = (idx + slides.length) % slides.length;
        slides[current].classList.add('rslide--active');
        dots?.[current].classList.add('rdot--active');
        dots?.[current].setAttribute('aria-selected', 'true');

        // Update label
        if (labelEl) {
            const label = slides[current].dataset.label || '';
            labelEl.textContent = label;
        }
    };

    const next = () => goTo(current + 1);

    const startAuto = () => {
        stopAuto();
        timer = setInterval(next, 2800);
    };
    const stopAuto = () => clearInterval(timer);

    // Manual dot navigation
    dots?.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            goTo(i);
            startAuto(); // restart timer after manual click
        });
    });

    // Pause on hover / focus
    const card = document.getElementById('bento-results');
    card?.addEventListener('mouseenter', stopAuto);
    card?.addEventListener('mouseleave', startAuto);
    card?.addEventListener('focusin', stopAuto);
    card?.addEventListener('focusout', startAuto);

    // Respect reduced-motion
    if (!CONFIG.REDUCED_MOTION) startAuto();
}
function initScrollReveal() {
    if (CONFIG.REDUCED_MOTION) {
        document.querySelectorAll('.reveal').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
        return;
    }

    withGSAP(() => {
        // Generic reveals
        document.querySelectorAll('.reveal').forEach(el => {
            gsap.fromTo(el,
                { opacity: 0, y: 36, force3D: true },
                {
                    opacity: 1, y: 0,
                    duration: 0.85,
                    ease: 'power3.out',
                    force3D: true,
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 88%',
                        toggleActions: 'play none none none',
                    },
                }
            );
        });

        // Stagger cards — services
        ScrollTrigger.batch('.service-card', {
            start: 'top 88%',
            onEnter: batch => gsap.fromTo(batch,
                { opacity: 0, y: 48, force3D: true },
                { opacity: 1, y: 0, stagger: 0.1, duration: 0.75, ease: 'power3.out', force3D: true, overwrite: true }
            ),
        });

        // Stagger cards — testimonials
        ScrollTrigger.batch('.testimonial-card', {
            start: 'top 88%',
            onEnter: batch => gsap.fromTo(batch,
                { opacity: 0, y: 36, force3D: true },
                { opacity: 1, y: 0, stagger: 0.12, duration: 0.7, ease: 'power3.out', force3D: true, overwrite: true }
            ),
        });

        // Stagger cards — blog
        ScrollTrigger.batch('.blog-card', {
            start: 'top 88%',
            onEnter: batch => gsap.fromTo(batch,
                { opacity: 0, y: 36, scale: 0.98, force3D: true },
                { opacity: 1, y: 0, scale: 1, stagger: 0.12, duration: 0.75, ease: 'power3.out', force3D: true, overwrite: true }
            ),
        });

        // Gallery items
        ScrollTrigger.batch('.gallery-item', {
            start: 'top 88%',
            onEnter: batch => gsap.fromTo(batch,
                { opacity: 0, scale: 0.95, force3D: true },
                { opacity: 1, scale: 1, stagger: 0.1, duration: 0.8, ease: 'power3.out', force3D: true, overwrite: true }
            ),
        });

        // Stats counter animation
        document.querySelectorAll('.stat-num').forEach(el => {
            ScrollTrigger.create({
                trigger: el,
                start: 'top 85%',
                once: true,
                onEnter: () => {
                    gsap.fromTo(el,
                        { opacity: 0, y: 20 },
                        { opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.4)' }
                    );
                },
            });
        });

        // Parallax on hero decorative number
        gsap.to('.hero-number', {
            y: -80,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1.5,
            },
        });
    });
}

/* ============================================================
   6. FLUID BACKGROUND — cursor parallax + mobile touch
   ============================================================ */
function initFluidBackground() {
    if (CONFIG.REDUCED_MOTION) return;

    withGSAP(() => {
        const blob1 = document.getElementById('blob-1');
        const blob2 = document.getElementById('blob-2');
        const blobCursor = document.getElementById('blob-cursor');
        if (!blob1 || !blob2 || !blobCursor) return;

        const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

        let W = window.innerWidth;
        let H = window.innerHeight;
        window.addEventListener('resize', () => { W = window.innerWidth; H = window.innerHeight; }, { passive: true });

        // quickTo setters — high-frequency update API
        const layers = [
            { el: blob1, xF: 0.03, yF: 0.022, dur: 1.6 },
            { el: blob2, xF: -0.02, yF: -0.018, dur: 2.0 },
            { el: blobCursor, xF: 0.85, yF: 0.85, dur: 0.45 },
        ].map(l => ({
            ...l,
            setX: gsap.quickTo(l.el, 'x', { duration: l.dur, ease: 'power2.out' }),
            setY: gsap.quickTo(l.el, 'y', { duration: l.dur, ease: 'power2.out' }),
        }));

        let rafPending = false;
        let rawX = W / 2, rawY = H / 2;

        const applyParallax = () => {
            rafPending = false;
            const nx = (rawX / W) - 0.5;
            const ny = (rawY / H) - 0.5;
            layers.forEach(l => {
                l.setX(nx * W * l.xF);
                l.setY(ny * H * l.yF);
            });
        };

        const schedule = (x, y) => {
            rawX = x; rawY = y;
            if (!rafPending) { rafPending = true; requestAnimationFrame(applyParallax); }
        };

        // Pause idle float CSS animation during interaction
        let idleTimer = null;
        const pauseFloat = () => { [blob1, blob2].forEach(b => b.style.animationPlayState = 'paused'); clearTimeout(idleTimer); };
        const resumeFloat = () => { idleTimer = setTimeout(() => { [blob1, blob2].forEach(b => b.style.animationPlayState = 'running'); }, 4000); };

        if (!isTouchDevice) {
            // ── DESKTOP ──
            let visible = false;
            document.addEventListener('mousemove', e => {
                if (!visible) { gsap.to(blobCursor, { opacity: 1, duration: 0.5 }); visible = true; }
                schedule(e.clientX, e.clientY);
                pauseFloat(); resumeFloat();
            }, { passive: true });

            document.addEventListener('mouseleave', () => gsap.to(blobCursor, { opacity: 0, duration: 0.6 }));
            document.addEventListener('mouseenter', () => { if (visible) gsap.to(blobCursor, { opacity: 1, duration: 0.3 }); });

        } else {
            // ── MOBILE / TOUCH ──
            gsap.to(blobCursor, { opacity: 0.7, duration: 0.3 });

            document.addEventListener('touchstart', e => {
                const t = e.touches[0];
                spawnRipple(t.clientX, t.clientY);
                schedule(t.clientX, t.clientY);
                pauseFloat(); resumeFloat();
            }, { passive: true });

            document.addEventListener('touchmove', e => {
                const t = e.touches[0];
                schedule(t.clientX, t.clientY);
            }, { passive: true });

            document.addEventListener('touchend', () => {
                gsap.to(blobCursor, { x: 0, y: 0, opacity: 0, duration: 1, ease: 'power3.out' });
            }, { passive: true });
        }

        function spawnRipple(x, y) {
            const r = document.createElement('div');
            r.className = 'touch-ripple-el';
            r.style.left = `${x - 35}px`;
            r.style.top = `${y - 35}px`;
            document.body.appendChild(r);
            r.addEventListener('animationend', () => r.remove(), { once: true });
        }
    });
}

/* ============================================================
   7. CONTACT FORM
   ============================================================ */
function initContactForm() {
    const form = document.getElementById('contact-form');
    const submit = document.getElementById('form-submit');
    if (!form || !submit) return;

    form.addEventListener('submit', async e => {
        e.preventDefault();

        // Basic validation
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        let valid = true;
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = '#D4A0C0';
                valid = false;
            } else {
                input.style.borderColor = '';
            }
        });
        if (!valid) return;

        // Loading state
        submit.textContent = 'Enviando...';
        submit.disabled = true;

        try {
            // Simulate async send (replace with real endpoint)
            await new Promise(resolve => setTimeout(resolve, 1200));

            // Success state
            submit.textContent = '¡Mensaje enviado! ✓';
            submit.style.background = '#4A2070';
            form.reset();

            setTimeout(() => {
                submit.textContent = 'Enviar Mensaje';
                submit.style.background = '';
                submit.disabled = false;
            }, 3500);

        } catch {
            submit.textContent = 'Error — intenta de nuevo';
            submit.disabled = false;
            setTimeout(() => { submit.textContent = 'Enviar Mensaje'; }, 3000);
        }
    });

    // Real-time border reset on input
    form.querySelectorAll('input, textarea').forEach(el => {
        el.addEventListener('input', () => { el.style.borderColor = ''; });
    });
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initMobileMenu();
    initContactForm();
    initBentoCarousel(); // results carousel — no GSAP dependency

    // Slight delay for deferred GSAP CDN scripts
    requestAnimationFrame(() => {
        setTimeout(() => {
            initHeroAnimation();
            initScrollReveal();
            initFluidBackground();
        }, 60);
    });
});