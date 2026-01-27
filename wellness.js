// JavaScript for responsive navigation menu and sticky header
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("navMenu");
  const navLinks = navMenu.querySelectorAll("a");

  function toggleMenu() {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
  }

  // Close menu when clicking a link
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      navMenu.classList.remove("active");
    });
  });

  // Auto-close menu on resize to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      hamburger.classList.remove("active");
      navMenu.classList.remove("active");
    }
  });

  // Sticky header
  window.addEventListener("scroll", () => {
    document
      .getElementById("header")
      .classList.toggle("sticky", window.scrollY > 50);
  });
  // Enhanced toggleMenu function for accessibility
  function toggleMenu() {
  const expanded = hamburger.classList.toggle("active");
  navMenu.classList.toggle("active");
  hamburger.setAttribute("aria-expanded", expanded);
}

// Keyboard accessibility for hamburger menu
hamburger.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    toggleMenu();
  }
});
// LIGHTBOX FUNCTIONALITY
function openLightbox(img) {
  document.getElementById("lightbox").style.display = "flex";
  document.getElementById("lightbox-img").src = img.src;
}

function closeLightbox() {
  document.getElementById("lightbox").style.display = "none";
}
// Add click event to all gallery images
document.querySelectorAll(".gallery img").forEach(img => {
  img.addEventListener("click", () => openLightbox(img));
});


