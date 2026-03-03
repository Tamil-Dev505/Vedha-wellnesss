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

        if (!('IntersectionObserver' in window)) return;
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
            if (img.getAttribute('src') && img.getAttribute('src') !== PLACEHOLDER && !img.dataset.src) return;
            if (!img.getAttribute('src')) img.src = PLACEHOLDER;
            if (img.dataset.src) io.observe(img);
        });
    })();

    // Ensure there are gallery items on the page
    const galleryItems = document.querySelectorAll('.gallery-item');
    if (!galleryItems.length) return;

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
        paginationEl.querySelector('.pg-prev').disabled = currentPage <= 1;
        paginationEl.querySelector('.pg-next').disabled = currentPage >= totalPages;
    }

    buildPagination();
    renderPage(1);

    // Staggered reveal for gallery items (adds .reveal to each visible item)
    const masonry = document.getElementById('masonryGallery');
    if (masonry) {
        const gitems = Array.from(masonry.querySelectorAll('.gallery-item'));
        gitems.forEach((gi, idx) => {
            setTimeout(() => gi.classList.add('reveal'), 120 + idx * 60);
        });
    }

    // 'Open gallery' instruction button opens first visible image: keep behavior simple
    const openGalleryBtn = document.getElementById('openGalleryBtn');
    if (openGalleryBtn && galleryContainer) {
        openGalleryBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const firstAnchor = galleryContainer.querySelector('.gallery-item a');
            if (firstAnchor) firstAnchor.click();
        });
    }

    // HERO background slider (kept minimal)
    const heroSlider = document.querySelector('.hero .hero-slider');
    if (heroSlider) {
        const slides = Array.from(heroSlider.querySelectorAll('.slide'));
        const dotsContainer = document.querySelector('.hero-dots') || (function(){ const d=document.createElement('div'); d.className='hero-dots'; heroSlider.parentNode.appendChild(d); return d; })();
        if (slides.length > 0) {
            let sIndex = 0;
            slides.forEach((s, i) => s.classList.toggle('active', i === 0));

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

            const heroText = document.querySelector('.hero-text');
            if (heroText) setTimeout(() => heroText.classList.add('is-visible'), 260);
        }
    }

    // LIGHTBOX: fullscreen viewer with close and navigation
    (function setupLightbox(){
        // Only enable the lightbox on the dedicated gallery page
        const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
        if (page !== 'gallery.html') return;

        const galleryRoot = document.getElementById('masonryGallery');
        if (!galleryRoot) return;
        const anchors = Array.from(galleryRoot.querySelectorAll('.gallery-item a'));
        if (!anchors.length) return;

        // build lightbox markup
        const lb = document.createElement('div');
        lb.className = 'lightbox';
        lb.innerHTML = `
            <div class="inner" tabindex="-1">
                <button class="close" aria-label="Close (Esc)">✕</button>
                <button class="prev" aria-label="Previous (Left)">◀</button>
                <button class="next" aria-label="Next (Right)">▶</button>
                <img src="" alt="" />
            </div>
        `;
        document.body.appendChild(lb);

        const imgEl = lb.querySelector('img');
        const closeBtn = lb.querySelector('.close');
        const prevBtn = lb.querySelector('.prev');
        const nextBtn = lb.querySelector('.next');

        let current = 0;

        function open(i){
            current = ((i % anchors.length) + anchors.length) % anchors.length;
            const href = anchors[current].href;
            imgEl.src = href;
            lb.classList.add('open');
            // focus for keyboard events
            const inner = lb.querySelector('.inner');
            if (inner) inner.focus();
        }

        function close(){
            lb.classList.remove('open');
            imgEl.src = '';
        }

        function showNext(){ open(current + 1); }
        function showPrev(){ open(current - 1); }

        // attach handlers to anchors
        anchors.forEach((a, idx) => {
            a.addEventListener('click', function(e){
                e.preventDefault();
                open(idx);
            });
        });

        // controls
        closeBtn.addEventListener('click', close);
        nextBtn.addEventListener('click', showNext);
        prevBtn.addEventListener('click', showPrev);

        // click on backdrop closes (but not clicks on image)
        lb.addEventListener('click', function(e){
            if (e.target === lb) close();
        });

        // keyboard navigation
        document.addEventListener('keydown', function(e){
            if (!lb.classList.contains('open')) return;
            if (e.key === 'Escape') { e.preventDefault(); close(); }
            if (e.key === 'ArrowRight') { e.preventDefault(); showNext(); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); showPrev(); }
        });

        // prevent page scroll when open
        const obs = new MutationObserver(() => {
            if (lb.classList.contains('open')) document.documentElement.style.overflow = 'hidden';
            else document.documentElement.style.overflow = '';
        });
        obs.observe(lb, { attributes: true, attributeFilter: ['class'] });
    })();

});
