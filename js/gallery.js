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

    // PAGINATION: show a strict 3x3 page (9 items per page) with controls
    const galleryContainer = document.getElementById('masonryGallery');
    const allItems = galleryContainer ? Array.from(galleryContainer.querySelectorAll('.gallery-item')) : [];
    const ITEMS_PER_PAGE = 9;
    let currentPage = 1;
    const totalPages = Math.max(1, Math.ceil(allItems.length / ITEMS_PER_PAGE));

    function renderPage(page) {
        currentPage = Math.min(Math.max(1, page), totalPages);
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        allItems.forEach((it, idx) => {
            it.style.display = (idx >= start && idx < end) ? '' : 'none';
        });
        updatePaginationControls();
    }

    // build simple pagination controls
    let paginationEl = null;
    function buildPagination() {
        if (!galleryContainer || totalPages <= 1) return;
        paginationEl = document.createElement('div');
        paginationEl.className = 'gallery-pagination';
        paginationEl.innerHTML = `
            <button class="pg-prev" aria-label="Previous page">◀</button>
            <div class="pg-pages"></div>
            <button class="pg-next" aria-label="Next page">▶</button>
        `;
        galleryContainer.parentNode.insertBefore(paginationEl, galleryContainer.nextSibling);
        paginationEl.querySelector('.pg-prev').addEventListener('click', () => renderPage(currentPage - 1));
        paginationEl.querySelector('.pg-next').addEventListener('click', () => renderPage(currentPage + 1));
    }

    function updatePaginationControls() {
        if (!paginationEl) return;
        const pagesContainer = paginationEl.querySelector('.pg-pages');
        pagesContainer.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.className = 'pg-num' + (i === currentPage ? ' active' : '');
            btn.textContent = i;
            btn.setAttribute('aria-label', 'Go to page ' + i);
            btn.addEventListener('click', () => renderPage(i));
            pagesContainer.appendChild(btn);
        }
        // disable prev/next when at edges
        paginationEl.querySelector('.pg-prev').disabled = currentPage <= 1;
        paginationEl.querySelector('.pg-next').disabled = currentPage >= totalPages;
    }

    buildPagination();
    renderPage(1);

    // Create lightbox element
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <div class="inner">
            <button class="close" aria-label="Close">✕</button>
            <button class="prev" aria-label="Previous">◀</button>
            <button class="fs-toggle" aria-label="Toggle fullscreen">⤢</button>
            <img src="" alt="" />
            <button class="next" aria-label="Next">▶</button>
        </div>
    `;
    document.body.appendChild(lightbox);

    const lbImg = lightbox.querySelector('img');
    const btnClose = lightbox.querySelector('.close');
    const btnPrev = lightbox.querySelector('.prev');
    const btnNext = lightbox.querySelector('.next');
    const btnFs = lightbox.querySelector('.fs-toggle');

    // helper to get currently visible anchors (after pagination)
    function getVisibleAnchors() {
        if (!galleryContainer) return [];
        return Array.from(galleryContainer.querySelectorAll('.gallery-item'))
            .filter(it => it.style.display !== 'none')
            .map(it => it.querySelector('a'))
            .filter(Boolean);
    }

    // mark anchors as image buttons for accessibility
    Array.from(document.querySelectorAll('.gallery-item a')).forEach(link => {
        link.classList.add('img-btn');
        if (!link.hasAttribute('role')) link.setAttribute('role', 'button');
        if (!link.hasAttribute('tabindex')) link.setAttribute('tabindex', '0');
    });

    let currentIndex = -1;

    function openLightbox(index) {
        const visible = getVisibleAnchors();
        currentIndex = index;
        const anchor = visible[currentIndex];
        if (!anchor) return;
        const href = anchor.getAttribute('href') || anchor.querySelector('img').src;
        lbImg.src = href;
        lightbox.classList.add('open');
        // ensure lightbox and image are forced to viewport via inline styles (strong override)
        lightbox.style.display = 'flex';
        lightbox.style.position = 'fixed';
        lightbox.style.inset = '0';
        lightbox.style.width = '100vw';
        lightbox.style.height = '100vh';
        const inner = lightbox.querySelector('.inner');
        if (inner) {
            inner.style.position = 'fixed';
            inner.style.inset = '0';
            inner.style.width = '100vw';
            inner.style.height = '100vh';
            inner.style.display = 'flex';
            inner.style.alignItems = 'center';
            inner.style.justifyContent = 'center';
        }
        lbImg.style.width = '100vw';
        lbImg.style.height = '100vh';
        lbImg.style.objectFit = 'cover';
        document.body.style.overflow = 'hidden';
        // Try to enter browser fullscreen (user gesture required; this call is from a click)
        try {
            if (lightbox.requestFullscreen) {
                lightbox.requestFullscreen();
            } else if (lightbox.webkitRequestFullscreen) {
                lightbox.webkitRequestFullscreen();
            }
        } catch (err) {
            // ignore if fullscreen fails
        }
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
        lightbox.classList.remove('fill');
        lbImg.src = '';
        document.body.style.overflow = '';
        // Exit fullscreen if active
        try {
            if (document.fullscreenElement) {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            }
        } catch (err) {
            // ignore
        }
        // remove inline styles applied on open
        lightbox.style.display = '';
        lightbox.style.position = '';
        lightbox.style.inset = '';
        lightbox.style.width = '';
        lightbox.style.height = '';
        const inner2 = lightbox.querySelector('.inner');
        if (inner2) {
            inner2.style.position = '';
            inner2.style.inset = '';
            inner2.style.width = '';
            inner2.style.height = '';
            inner2.style.display = '';
            inner2.style.alignItems = '';
            inner2.style.justifyContent = '';
        }
        lbImg.style.width = '';
        lbImg.style.height = '';
        lbImg.style.objectFit = '';
    }

    function showPrev() {
        const visible = getVisibleAnchors();
        if (!visible.length) return;
        if (currentIndex <= 0) currentIndex = visible.length - 1; else currentIndex -= 1;
        openLightbox(currentIndex);
    }

    function showNext() {
        const visible = getVisibleAnchors();
        if (!visible.length) return;
        if (currentIndex >= visible.length - 1) currentIndex = 0; else currentIndex += 1;
        openLightbox(currentIndex);
    }

    // Use event delegation on the gallery container so pagination doesn't require rebinding
    if (galleryContainer) {
        galleryContainer.addEventListener('click', function (e) {
            const link = e.target.closest('a');
            if (!link || !galleryContainer.contains(link)) return;
            const parent = link.closest('.gallery-item');
            if (!parent || parent.style.display === 'none') return;
            e.preventDefault();
            const visible = getVisibleAnchors();
            const idx = visible.indexOf(link);
            if (idx >= 0) openLightbox(idx);
        });

        galleryContainer.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const link = e.target.closest('a');
            if (!link || !galleryContainer.contains(link)) return;
            const parent = link.closest('.gallery-item');
            if (!parent || parent.style.display === 'none') return;
            e.preventDefault();
            const visible = getVisibleAnchors();
            const idx = visible.indexOf(link);
            if (idx >= 0) openLightbox(idx);
        });
    }

    // staggered reveal for gallery items
    const masonry = document.getElementById('masonryGallery');
    if (masonry) {
        const gitems = Array.from(masonry.querySelectorAll('.gallery-item'));
        gitems.forEach((gi, idx) => {
            setTimeout(() => gi.classList.add('reveal'), 120 + idx * 60);
        });
    }

    // 'Open gallery' instruction button opens first visible image
    const openGalleryBtn = document.getElementById('openGalleryBtn');
    if (openGalleryBtn) {
        openGalleryBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const visible = getVisibleAnchors();
            if (visible.length) openLightbox(0);
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
        if (e.key === 'f' || e.key === 'F') {
            // toggle fullscreen
            if (document.fullscreenElement) {
                if (document.exitFullscreen) document.exitFullscreen();
            } else {
                if (lightbox.requestFullscreen) lightbox.requestFullscreen();
            }
        }
    });

    // Sync .fill class with actual fullscreen state (if fullscreen is used)
    document.addEventListener('fullscreenchange', function () {
        if (document.fullscreenElement) {
            lightbox.classList.add('fill');
        } else {
            // only remove fill when lightbox is closed or fullscreen exited
            lightbox.classList.remove('fill');
        }
    });

    // Fullscreen toggle button (explicit user gesture fallback)
    if (btnFs) {
        btnFs.addEventListener('click', function (e) {
            e.stopPropagation();
            if (document.fullscreenElement) {
                if (document.exitFullscreen) document.exitFullscreen();
            } else {
                if (lightbox.requestFullscreen) lightbox.requestFullscreen();
            }
        });
    }

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