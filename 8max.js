(function () {
    const body = document.body;
    const drawer = document.getElementById('mobile-drawer');
    const hamburger = document.querySelector('.hamburger');
    const overlay = document.querySelector('.overlay');
    const closeBtn = document.querySelector('.drawer-close');

    if (drawer && hamburger && overlay) {
        function openDrawer() {
            drawer.classList.add('open');
            drawer.setAttribute('aria-hidden', 'false');
            hamburger.setAttribute('aria-expanded', 'true');
            overlay.hidden = false;
            overlay.style.backdropFilter = 'none';
            overlay.style.pointerEvents = 'none';
            body.style.overflow = 'hidden';
        }
        function closeDrawer() {
            drawer.classList.remove('open');
            drawer.setAttribute('aria-hidden', 'true');
            hamburger.setAttribute('aria-expanded', 'false');
            overlay.hidden = true;
            overlay.style.backdropFilter = 'blur(4px)';
            overlay.style.pointerEvents = 'auto';
            body.style.overflow = '';
        }
        hamburger.addEventListener('click', () => {
            const isOpen = drawer.classList.contains('open');
            isOpen ? closeDrawer() : openDrawer();
        });
        overlay.addEventListener('click', closeDrawer);
        if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
    }

    // Sync active state between desktop and mobile menus
    (function setupActiveMenuSync() {
        const desktopLinks = Array.from(document.querySelectorAll('.nav-links a'));
        const drawerLinks = Array.from(document.querySelectorAll('.drawer-links a'));

        if (desktopLinks.length === 0 && drawerLinks.length === 0) return;

        function clearActiveStates() {
            [...desktopLinks, ...drawerLinks].forEach((link) => {
                link.classList.remove('is-active');
                if (link.hasAttribute('aria-current')) link.removeAttribute('aria-current');
            });
        }

        function activateIndex(index) {
            clearActiveStates();
            const d = desktopLinks[index];
            const m = drawerLinks[index];
            if (d) { d.classList.add('is-active'); d.setAttribute('aria-current', 'page'); }
            if (m) { m.classList.add('is-active'); m.setAttribute('aria-current', 'page'); }
        }

        // Ensure links have matching hashes to identify section
        const defaultHashes = ['#inicio', '#promocao', '#deposito', '#saque', '#perfil'];
        desktopLinks.forEach((link, idx) => {
            if (!link.getAttribute('href') || link.getAttribute('href') === '#') {
                link.setAttribute('href', defaultHashes[idx] || `#item-${idx+1}`);
            }
        });
        drawerLinks.forEach((link, idx) => {
            if (!link.getAttribute('href') || link.getAttribute('href') === '#') {
                link.setAttribute('href', desktopLinks[idx]?.getAttribute('href') || defaultHashes[idx] || `#item-${idx+1}`);
            }
        });

        function activateByHash(hash) {
            if (!hash) return false;
            const idx = desktopLinks.findIndex((l) => l.getAttribute('href') === hash);
            if (idx >= 0) { activateIndex(idx); return true; }
            const idx2 = drawerLinks.findIndex((l) => l.getAttribute('href') === hash);
            if (idx2 >= 0) { activateIndex(idx2); return true; }
            return false;
        }

        desktopLinks.forEach((link, idx) => {
            link.addEventListener('click', (e) => {
                // Prevent page jump for same-hash and just activate
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) e.preventDefault();
                activateIndex(idx);
                if (href) history.replaceState(null, '', href);
            });
        });

        drawerLinks.forEach((link, idx) => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) e.preventDefault();
                activateIndex(idx);
                if (href) history.replaceState(null, '', href);
                // Close drawer after selection
                if (drawer && drawer.classList.contains('open')) {
                    const ov = document.querySelector('.overlay');
                    if (ov) ov.click();
                }
            });
        });

        // Activate on load based on current hash
        if (!activateByHash(location.hash)) {
            // If no match, default to first item
            activateIndex(0);
        }

        // Keep in sync if hash changes
        window.addEventListener('hashchange', () => {
            activateByHash(location.hash);
        });
    })();

    // Funcionalidade dos modais usando dialog nativo
    (function setupNativeModals() {
        const loginButtons = document.querySelectorAll('.entrar');
        const registerButtons = document.querySelectorAll('.registrar');
        const loginModal = document.getElementById('login-modal');
        const registerModal = document.getElementById('register-modal');

        // Event listeners para botões de login
        loginButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                if (loginModal) loginModal.showModal();
            });
        });

        // Event listeners para botões de registro
        registerButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                if (registerModal) registerModal.showModal();
            });
        });

        // Validação personalizada para confirmação de senha
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            const passwordField = document.getElementById('register-password');
            const confirmField = document.getElementById('register-confirm-password');
            
            function validatePasswords() {
                if (passwordField.value !== confirmField.value) {
                    confirmField.setCustomValidity('As senhas não coincidem');
                } else {
                    confirmField.setCustomValidity('');
                }
            }
            
            if (passwordField && confirmField) {
                passwordField.addEventListener('input', validatePasswords);
                confirmField.addEventListener('input', validatePasswords);
            }
        }
    })();

    // Mobile banners slider with autoplay
    const track = document.querySelector('.banners-track');
    const prev = document.querySelector('.banners .prev');
    const next = document.querySelector('.banners .next');
    const dotsContainer = document.querySelector('.banners-dots');

    if (track && dotsContainer) {
        const slides = Array.from(track.querySelectorAll('.banner'));
        const numSlides = slides.length;
        const AUTOPLAY_MS = 4000;
        let autoplayTimer = null;
        let progressTimer = null;

        function makeDot(idx) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.setAttribute('aria-label', `Ir para banner ${idx + 1}`);
            const bar = document.createElement('div');
            bar.className = 'bar';
            dot.appendChild(bar);
            return dot;
        }

        slides.forEach((_, idx) => {
            const dot = makeDot(idx);
            if (idx === 0) dot.setAttribute('aria-current', 'true');
            dot.addEventListener('click', () => {
                stopAutoplay(true);
                track.scrollTo({ left: idx * track.clientWidth, behavior: 'smooth' });
            });
            dotsContainer.appendChild(dot);
        });

        function currentIndex() {
            return Math.round(track.scrollLeft / track.clientWidth);
        }

        function syncDots() {
            const index = currentIndex();
            const dots = Array.from(dotsContainer.querySelectorAll('button'));
            dots.forEach((d, i) => {
                if (i === index) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
            });
        }

        function animateProgress() {
            const dots = Array.from(dotsContainer.querySelectorAll('button'));
            const idx = currentIndex();
            dots.forEach((d, i) => {
                const bar = d.querySelector('.bar');
                if (!bar) return;
                bar.style.transitionDuration = '0ms';
                bar.style.width = i === idx ? '0%' : '0%';
                // force reflow
                void bar.offsetWidth;
                if (i === idx) {
                    bar.style.transitionDuration = AUTOPLAY_MS + 'ms';
                    bar.style.width = '100%';
                }
            });
        }

        function go(direction) {
            const index = currentIndex();
            const target = Math.min(Math.max(index + direction, 0), numSlides - 1);
            track.scrollTo({ left: target * track.clientWidth, behavior: 'smooth' });
        }

        function nextSlide() {
            const index = currentIndex();
            const target = (index + 1) % numSlides;
            track.scrollTo({ left: target * track.clientWidth, behavior: 'smooth' });
        }

        function startAutoplay() {
            stopAutoplay(false);
            animateProgress();
            autoplayTimer = setInterval(() => {
                nextSlide();
                animateProgress();
            }, AUTOPLAY_MS);
        }

        function stopAutoplay(restart) {
            if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
            if (progressTimer) { clearTimeout(progressTimer); progressTimer = null; }
            if (restart) {
                // small delay to avoid jank after user interaction
                progressTimer = setTimeout(startAutoplay, 800);
            }
        }

        if (prev) prev.addEventListener('click', () => { stopAutoplay(true); go(-1); });
        if (next) next.addEventListener('click', () => { stopAutoplay(true); go(1); });

        track.addEventListener('scroll', () => { window.requestAnimationFrame(syncDots); });
        window.addEventListener('resize', () => { syncDots(); animateProgress(); });

        syncDots();
        startAutoplay();
    }
})();
