// Shared header/footer templates and resilient UI behaviors
document.addEventListener('DOMContentLoaded', () => {
  // Header template (matches existing CSS classes)
  const headerTemplate = `
    <header class="navbar">
      <div class="nav-container">
        <div class="brand">
          <a href="index.html" class="brand-link">
            <img src="images/logo.png" class="nav-logo" alt="Logo">
            <img src="images/logow.png" class="nav-wordmark" alt="Vedha Wellness Studio">
          </a>
        </div>

        <nav class="nav-menu" id="navMenu">
          <a href="index.html">Home</a>
          <a href="about.html">About Us</a>
          <a href="service.html">Services</a>
          <a href="gallery.html">Gallery</a>
          <a href="contact.html">Contact Us</a>
        </nav>

        <div class="hamburger" id="hamburger" aria-label="Toggle navigation">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </header>
  `;

  const footerTemplate = `
    <footer class="footer">
      <div class="footer-inner container">
        <div class="footer-col contact">
          <img src="images/logo.png" class="footer-logo" alt="The Vedha Wellness Studio logo">
          <h4>Contact</h4>
          <p class="muted">The Vedha Wellness Studio<br>Kalluri Nagar, 3rd Cross Street, Peelamedu<br>Coimbatore</p>
          <p class="contact-phones"><a href="tel:7200205141">7200205141</a><br><a href="tel:9087161189">9087161189</a></p>
          <div class="social-icons">
            <a href="https://wa.me/917200205141" target="_blank" rel="noopener" class="social" aria-label="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
            <a href="#" class="social" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
            <a href="#" class="social" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
          </div>
        </div>
        <div class="footer-col links">
          <h4>Quick Links</h4>
          <nav aria-label="Footer navigation">
            <a href="index.html">Home</a>
            <a href="about.html">About</a>
            <a href="service.html">Services</a>
            <a href="gallery.html">Gallery</a>
            <a href="contact.html">Contact</a>
          </nav>
        </div>
        <div class="footer-col newsletter">
          <h4>Stay In Touch</h4>
          <p class="muted">Sign up for occasional updates, events and wellness tips.</p>
          <form class="newsletter-form" action="#" onsubmit="event.preventDefault(); alert('Thanks — subscription simulated.');">
            <label class="sr-only" for="footer-email">Email</label>
            <input id="footer-email" type="email" placeholder="Your email" required />
            <button class="btn small primary" type="submit">Subscribe</button>
          </form>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="container footer-bottom-inner">
          <p>© <span id="year"></span> The Vedha Wellness Studio — Wellness from Within</p>
          <p class="made-with">Designed with care • <a href="about.html">Learn more</a></p>
        </div>
      </div>
    </footer>
  `;

  // Inject if placeholders exist
  const headerPlaceholder = document.getElementById('site-header');
  const footerPlaceholder = document.getElementById('site-footer');

  if (headerPlaceholder) headerPlaceholder.innerHTML = headerTemplate;
  if (footerPlaceholder) footerPlaceholder.innerHTML = footerTemplate;

  // Set year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // NAV: hamburger toggle
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  if (hamburger && navMenu) {
    // accessibility attributes
    hamburger.setAttribute('role', 'button');
    hamburger.setAttribute('aria-controls', 'navMenu');
    hamburger.setAttribute('aria-expanded', 'false');
    navMenu.setAttribute('aria-hidden', 'true');

    function closeMenu() {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      navMenu.setAttribute('aria-hidden', 'true');
    }

    function openMenu() {
      hamburger.classList.add('active');
      navMenu.classList.add('active');
      hamburger.setAttribute('aria-expanded', 'true');
      navMenu.setAttribute('aria-hidden', 'false');
    }

    hamburger.addEventListener('click', () => {
      if (navMenu.classList.contains('active')) closeMenu();
      else openMenu();
    });

    // close when nav link clicked
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => closeMenu());
    });

    // ensure menu closes when resizing to wider screens
    window.addEventListener('resize', () => {
      try {
        if (window.innerWidth >= 641) {
          // on larger screens, ensure nav is visible and hamburger inactive
          navMenu.classList.remove('active');
          hamburger.classList.remove('active');
          hamburger.setAttribute('aria-expanded', 'false');
          navMenu.setAttribute('aria-hidden', 'false');
        } else {
          navMenu.setAttribute('aria-hidden', navMenu.classList.contains('active') ? 'false' : 'true');
        }
      } catch (e) {}
    });
  }

  // Highlight active nav item
  try {
    const current = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('#navMenu a').forEach(a => {
      const href = a.getAttribute('href');
      if (href && href === current) a.classList.add('active');
    });
  } catch (e) {}

  // STICKY NAVBAR
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) navbar.classList.add('sticky');
      else navbar.classList.remove('sticky');
    });
  }


  // CONTACT FORM SUBMISSION — graceful when absent
  const form = document.getElementById('contactForm');
  const button = document.getElementById('submitBtn');
  const successMsg = document.getElementById('successMsg');

  if (form && button) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      button.classList.add('loading');
      const original = button.textContent;
      button.textContent = 'Sending...';
      setTimeout(() => {
        button.classList.remove('loading');
        button.textContent = original || 'Send Message';
        if (successMsg) successMsg.style.display = 'block';
        form.reset();
      }, 1200);
    });
  }

  // TEAM IMAGES: mark missing images and show placeholders
  document.querySelectorAll('.team-member img').forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
      img.parentElement.classList.add('no-photo');
    });
    // if already broken (cached), check naturalWidth
    if (img.naturalWidth === 0) {
      img.style.display = 'none';
      img.parentElement.classList.add('no-photo');
    }
  });

  // HERO BACKGROUND SLIDESHOW (two-layer crossfade)
  (function(){
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const images = [
      'images/VedhaWellness/1.jpg',
      'images/VedhaWellness/3.jpg',
      'images/VedhaWellness/5.jpg',
      'images/VedhaWellness/11.jpg',
      'images/VedhaWellness/24.jpg'
    ];

    let idx = 0;
    let layerA = document.createElement('div');
    let layerB = document.createElement('div');
    layerA.className = 'hero-bg-layer';
    layerB.className = 'hero-bg-layer';
    // insert layers as first children so they sit below hero content
    hero.insertBefore(layerB, hero.firstChild);
    hero.insertBefore(layerA, hero.firstChild);

    layerA.style.backgroundImage = `url("${images[0]}")`;
    layerA.style.opacity = '1';
    layerB.style.opacity = '0';

    function nextSlide(){
      const next = (idx + 1) % images.length;
      // prepare top layer with next image
      layerB.style.backgroundImage = `url("${images[next]}")`;
      // force paint
      void layerB.offsetWidth;
      // crossfade
      layerA.style.opacity = '0';
      layerB.style.opacity = '1';
      // swap references after transition
      setTimeout(()=>{
        const tmp = layerA; layerA = layerB; layerB = tmp;
        idx = next;
      }, 1300);
    }

    let timer = setInterval(nextSlide, 6000);
    hero.addEventListener('mouseenter', ()=> clearInterval(timer));
    hero.addEventListener('mouseleave', ()=> timer = setInterval(nextSlide, 6000));
  })();

  // SECTION REVEAL: add .in-view to sections when they enter viewport
  (function(){
    const sections = document.querySelectorAll('main section, section');
    if (!('IntersectionObserver' in window) || !sections.length) return;
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          // optionally unobserve to keep performance
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

    sections.forEach(s => obs.observe(s));
  })();
});




