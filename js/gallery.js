document.addEventListener('DOMContentLoaded', function () {
    // Better lazy-loading + safe WebP swap without external tools
    (function enhanceImages() {
        const PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

        function supportsWebP() {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = function () { resolve(img.width === 1 && img.height === 1); };
                img.onerror = function () { resolve(false); };
                img.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
            });
        }

        async function urlExists(url) {
            try {
                const res = await fetch(url, { method: 'HEAD' });
                return res.ok;
            } catch (e) { return false; }
        }

        // Swap to .webp only if the .webp file actually exists on the server
        (async function tryWebPSwap() {
            const webpSupported = await supportsWebP();
            if (!webpSupported) return;
            const imgs = Array.from(document.querySelectorAll('.gallery-item img'));
            for (const img of imgs) {
                const orig = img.dataset.src || img.getAttribute('data-src') || img.getAttribute('src');
                if (!orig) continue;
                if (/\.jpe?g$/i.test(orig)) {
                    const webp = orig.replace(/\.(jpe?g)$/i, '.webp');
                    if (await urlExists(webp)) {
                        img.dataset.src = webp;
                        const a = img.closest('a');
                        if (a && /\.jpe?g$/i.test(a.href)) a.href = a.href.replace(/\.(jpe?g)$/i, '.webp');
                    }
                }
            }
        })();

        // IntersectionObserver-based lazy loader (works even where native lazy isn't ideal)
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const img = entry.target;
                const src = img.dataset.src;
                if (src) img.src = src;
                img.removeAttribute('data-src');
                obs.unobserve(img);
            });
        }, { rootMargin: '200px 0px', threshold: 0.01 });

        document.querySelectorAll('.gallery-item img').forEach(img => {
            // if image already has a real src (not the tiny placeholder), skip
            if (img.getAttribute('src') && img.getAttribute('src') !== PLACEHOLDER && !img.dataset.src) return;
            // ensure placeholder exists so nothing breaks before JS runs
            if (!img.getAttribute('src')) img.src = PLACEHOLDER;
            if (img.dataset.src) io.observe(img);
        });
    })();
    const gallery = document.querySelectorAll('.gallery-item');
    if (!gallery.length) return;

    // Create lightbox element
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <div class="inner">
            <button class="close" aria-label="Close">✕</button>
            <button class="prev" aria-label="Previous">◀</button>
            <img src="" alt="" />
            <button class="next" aria-label="Next">▶</button>
        </div>
    `;
    document.body.appendChild(lightbox);

    const lbImg = lightbox.querySelector('img');
    const btnClose = lightbox.querySelector('.close');
    const btnPrev = lightbox.querySelector('.prev');
    const btnNext = lightbox.querySelector('.next');

    const items = Array.from(document.querySelectorAll('.gallery-item a'));
    // make anchors behave and appear like accessible buttons
    items.forEach(link => {
        link.classList.add('img-btn');
        // ensure it's announced as a button for assistive tech
        if (!link.hasAttribute('role')) link.setAttribute('role', 'button');
        if (!link.hasAttribute('tabindex')) link.setAttribute('tabindex', '0');
        // open lightbox on Enter or Space
        link.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                link.click();
            }
        });
    });
    let currentIndex = -1;

    function openLightbox(index) {
        currentIndex = index;
        const href = items[currentIndex].getAttribute('href') || items[currentIndex].querySelector('img').src;
        lbImg.src = href;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
        lbImg.src = '';
        document.body.style.overflow = '';
    }

    function showPrev() {
        if (currentIndex <= 0) currentIndex = items.length - 1; else currentIndex -= 1;
        openLightbox(currentIndex);
    }

    function showNext() {
        if (currentIndex >= items.length - 1) currentIndex = 0; else currentIndex += 1;
        openLightbox(currentIndex);
    }

    items.forEach((link, i) => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            openLightbox(i);
        });
    });

    // staggered reveal for gallery items
    const masonry = document.getElementById('masonryGallery');
    if (masonry) {
        const gitems = Array.from(masonry.querySelectorAll('.gallery-item'));
        gitems.forEach((gi, idx) => {
            setTimeout(() => gi.classList.add('reveal'), 120 + idx * 60);
        });
    }

    // 'Open gallery' instruction button opens first image
    const openGalleryBtn = document.getElementById('openGalleryBtn');
    if (openGalleryBtn) {
        openGalleryBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (items.length) openLightbox(0);
        });
    }

    btnClose.addEventListener('click', closeLightbox);
    btnPrev.addEventListener('click', function (e) { e.stopPropagation(); showPrev(); });
    btnNext.addEventListener('click', function (e) { e.stopPropagation(); showNext(); });

    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showPrev();
        if (e.key === 'ArrowRight') showNext();
    });

    // Hero background slider
    const heroSlider = document.querySelector('.hero .hero-slider');
    if (heroSlider) {
        const slides = Array.from(heroSlider.querySelectorAll('.slide'));
        const dotsContainer = document.querySelector('.hero-dots') || (function(){ const d=document.createElement('div'); d.className='hero-dots'; heroSlider.parentNode.appendChild(d); return d; })();
        if (slides.length > 0) {
            let sIndex = 0;
            slides.forEach((s, i) => s.classList.toggle('active', i === 0));

            // build dots
            slides.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.className = 'dot';
                dot.setAttribute('aria-label', 'Go to slide ' + (i+1));
                dot.addEventListener('click', function () { goToSlide(i); });
                dotsContainer.appendChild(dot);
            });

            const dots = Array.from(dotsContainer.querySelectorAll('.dot'));
            dots.forEach((d, i) => d.classList.toggle('active', i === 0));

            const heroSection = document.querySelector('.hero');
            // mirror current slide as hero background (helps on some devices)
            if (heroSection) heroSection.style.backgroundImage = slides[0].style.backgroundImage || '';
            let sliderTimer = setInterval(nextSlide, 5000);

            function updateDots() {
                dots.forEach((d, i) => d.classList.toggle('active', i === sIndex));
            }

            function goToSlide(index) {
                slides[sIndex].classList.remove('active');
                sIndex = index;
                slides[sIndex].classList.add('active');
                updateDots();
                if (heroSection) heroSection.style.backgroundImage = slides[sIndex].style.backgroundImage || '';
                // reset timer
                clearInterval(sliderTimer);
                sliderTimer = setInterval(nextSlide, 5000);
            }

            function nextSlide() {
                slides[sIndex].classList.remove('active');
                sIndex = (sIndex + 1) % slides.length;
                slides[sIndex].classList.add('active');
                updateDots();
                if (heroSection) heroSection.style.backgroundImage = slides[sIndex].style.backgroundImage || '';
            }

            heroSlider.addEventListener('mouseenter', function () { clearInterval(sliderTimer); });
            heroSlider.addEventListener('mouseleave', function () { sliderTimer = setInterval(nextSlide, 5000); });

            // reveal hero text with entrance animation
            const heroText = document.querySelector('.hero-text');
            if (heroText) setTimeout(() => heroText.classList.add('is-visible'), 260);
        }
    }
});