/* LOADER.JS — Charge les composants HTML */

document.addEventListener('DOMContentLoaded', loadComponents);

async function loadComponents() {
  const placeholders = document.querySelectorAll('[data-include]');

  for (const el of placeholders) {
    const file = el.getAttribute('data-include');
    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`Impossible de charger : ${file}`);
      const html = await response.text();
      el.outerHTML = html;
    } catch (err) {
      console.error(err);
    }
  }

  initI18n();
  document.dispatchEvent(new CustomEvent('fideliio:components-loaded'));
  initFaq();
  initScrollReveal();
  if (typeof initPricing === "function") initPricing();
}

/* ── FAQ toggle ── */
function initFaq() {
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', function () {
      const item = this.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

/* ── Scroll reveal ── */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.step-card, .reward-card, .testi-card, .brand-pill, .pricing-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    observer.observe(el);
  });
}
