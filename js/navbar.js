/* ══════════════════════════════════════════
   NAVBAR — Hamburger Menu
   Ajoutez dans js/loader.js ou js/navbar.js
   ══════════════════════════════════════════ */

function toggleNavMenu() {
  const links   = document.getElementById("navLinks");
  const burger  = document.getElementById("navHamburger");
  if (!links || !burger) return;

  links.classList.toggle("open");
  burger.classList.toggle("open");

  /* Bloque le scroll quand menu ouvert */
  document.body.style.overflow = links.classList.contains("open") ? "hidden" : "";
}

/* Ferme le menu en cliquant sur un lien */
document.addEventListener("click", e => {
  const links  = document.getElementById("navLinks");
  const burger = document.getElementById("navHamburger");
  if (!links || !burger) return;

  if (e.target.closest(".nav-links a")) {
    links.classList.remove("open");
    burger.classList.remove("open");
    document.body.style.overflow = "";
  }
});

/* Ferme le menu en cliquant en dehors */
document.addEventListener("click", e => {
  const links  = document.getElementById("navLinks");
  const burger = document.getElementById("navHamburger");
  const nav    = document.querySelector("nav");
  if (!links || !burger || !nav) return;

  if (!nav.contains(e.target) && links.classList.contains("open")) {
    links.classList.remove("open");
    burger.classList.remove("open");
    document.body.style.overflow = "";
  }
});