document.addEventListener('DOMContentLoaded', function () {

    // Generate testimonials dynamically
    (function buildTestimonials() {
        var grid = document.getElementById('testimonialsGrid');
        if (!grid) return;
        var testimonials = [
            { name: 'Priya R.', avatar: 'avatar-1.svg', date: 'Reviewed Jan 10, 2026', stars: 5, quote: 'The team at Vedha helped me recover after months of back pain. Gentle, effective care.' },
            { name: 'Arun M.', avatar: 'avatar-2.svg', date: 'Reviewed Nov 3, 2025', stars: 5, quote: 'Personalized guidance and follow-up \u2014 I feel more energetic and calm.' },
            { name: 'Sangeeta K.', avatar: 'avatar-3.svg', date: 'Reviewed Sep 15, 2025', stars: 5, quote: 'Great atmosphere, very professional therapists. Highly recommended.' },
            { name: 'Meera S.', avatar: 'avatar-4.svg', date: 'Reviewed Dec 1, 2025', stars: 5, quote: 'I tried Vedha for a deep tissue massage after months of desk work \u2014 my posture improved within a week. The therapist explained every step and offered follow-up stretches.' },
            { name: 'Rohit P.', avatar: 'avatar-5.svg', date: 'Reviewed Oct 21, 2025', stars: 4, quote: 'Very effective physiotherapy sessions after my sports injury \u2014 attentive staff and excellent follow-up care.' },
            { name: 'Anita L.', avatar: 'avatar-1.svg', date: 'Reviewed Feb 2, 2026', stars: 5, quote: 'I come here monthly \u2014 the space is calm, appointments run on time, and the therapists remember my needs. Highly recommended for regular care.' }
        ];
        testimonials.forEach(function(t) {
            var card = document.createElement('div');
            card.className = 'testimonial-card';
            var starsHTML = '';
            for (var s = 0; s < t.stars; s++) starsHTML += '<i class="fa-solid fa-star"></i>';
            card.innerHTML =
                '<div class="testimonial-meta">' +
                    '<img class="avatar-img" src="images/avatars/' + t.avatar + '" alt="' + t.name + '">' +
                    '<div class="meta-text">' +
                        '<div class="name">' + t.name + '</div>' +
                        '<div class="date">' + t.date + '</div>' +
                        '<div class="rating" aria-label="' + t.stars + ' out of 5 stars">' + starsHTML + '</div>' +
                    '</div>' +
                '</div>' +
                '<blockquote class="quote">' + t.quote + '</blockquote>';
            grid.appendChild(card);
        });
    })();

    // Generate gallery items dynamically
    (function buildGallery() {
        var gallery = document.getElementById('masonryGallery');
        if (!gallery) return;
        // Only populate if gallery page (empty container)
        if (gallery.children.length > 0) return;
        var images = [
            '2','3','4','5','12','6','7','9','11','12',
            '13','14','39','16','17','20','19','36','21','22',
            '23','24','25','26','27','28','29','30','44','32',
            '33','34','43','36','37','38'
        ];
        images.forEach(function(num, i) {
            var fig = document.createElement('figure');
            fig.className = 'gallery-item';
            var a = document.createElement('a');
            a.href = 'images/VedhaWellness/' + num + '.jpg';
            var img = document.createElement('img');
            img.loading = 'lazy';
            img.src = 'images/VedhaWellness/' + num + '.jpg';
            img.alt = 'gallery ' + (i + 1);
            a.appendChild(img);
            fig.appendChild(a);
            gallery.appendChild(fig);
        });
    })();

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
        // Add responsive `srcset` and `sizes` to gallery thumbnails to reduce mobile bandwidth where possible.
        // This will not replace image assets; consider generating smaller image variants (e.g., 480/800/1200px)
        // and updating the srcset URLs to those smaller files for real savings.
        document.querySelectorAll('.gallery-item img').forEach(img => {
            try {
                const src = img.getAttribute('src') || img.dataset.src;
                if (!src) return;
                // Provide a reasonable sizes hint for the gallery grid
                img.setAttribute('srcset', `${src} 480w, ${src} 800w, ${src} 1200w`);
                img.setAttribute('sizes', '(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw');
            } catch (e) { /* ignore */ }
        });

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

        // touch / swipe support for lightbox on touch devices
        let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;
        lb.addEventListener('touchstart', function (ev) {
            if (!lb.classList.contains('open')) return;
            const t = ev.touches && ev.touches[0];
            if (!t) return;
            touchStartX = t.clientX; touchStartY = t.clientY;
            touchEndX = touchStartX; touchEndY = touchStartY;
        }, { passive: true });

        lb.addEventListener('touchmove', function (ev) {
            if (!lb.classList.contains('open')) return;
            const t = ev.touches && ev.touches[0];
            if (!t) return;
            touchEndX = t.clientX; touchEndY = t.clientY;
        }, { passive: true });

        lb.addEventListener('touchend', function () {
            if (!lb.classList.contains('open')) return;
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            // horizontal swipe threshold
            if (Math.abs(dx) > 50 && Math.abs(dy) < 120) {
                if (dx < 0) showNext(); else showPrev();
            }
            touchStartX = touchStartY = touchEndX = touchEndY = 0;
        });

        // prevent page scroll when open
        const obs = new MutationObserver(() => {
            if (lb.classList.contains('open')) document.documentElement.style.overflow = 'hidden';
            else document.documentElement.style.overflow = '';
        });
        obs.observe(lb, { attributes: true, attributeFilter: ['class'] });
    })();

});
