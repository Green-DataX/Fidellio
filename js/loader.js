/* LOADER.JS — Charge les composants HTML */

/** Sur pages sous components/ (ex. paiement), les img relatives pointent vers la racine du site. */
function fixLogoMarkPaths(root) {
  const raw = (location.pathname || '').replace(/\\/g, '/');
  const parts = raw.split('/').filter(Boolean);
  const idx = parts.indexOf('components');
  if (idx === -1) return;
  const prefix = '../'.repeat(parts.length - idx - 1);
  root.querySelectorAll('img.logo-mark[src]').forEach((img) => {
    const src = (img.getAttribute('src') || '').trim();
    if (!src || src.startsWith('data:') || /^https?:/i.test(src) || src.startsWith('/')) return;
    if (src.startsWith('../')) return;
    img.setAttribute('src', prefix + src.replace(/^\.\//, ''));
  });
}

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

  fixLogoMarkPaths(document);

  initI18n();
  document.dispatchEvent(new CustomEvent('fideliio:components-loaded'));
  initFaq();
  initScrollReveal();
  if (typeof initPricing === "function") initPricing();
}

/* ── FAQ accordéon (une entrée ouverte, aria-expanded) — uniquement le panneau principal, pas la copie décorative marquee */
function initFaq() {
  const faqRoot = document.querySelector('.faq-section .faq-panel:not(.faq-panel--marquee)');
  if (!faqRoot) return;

  faqRoot.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    if (btn) btn.setAttribute('aria-expanded', item.classList.contains('open'));
  });

  faqRoot.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', function () {
      const item = this.closest('.faq-item');
      if (!item || !faqRoot.contains(item)) return;
      const isOpen = item.classList.contains('open');
      faqRoot.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
        const b = i.querySelector('.faq-q');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        this.setAttribute('aria-expanded', 'true');
      }
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

  document.querySelectorAll('.step-card, .reward-card, .testi-card, .brand-card, .pricing-card, .faq-section .faq-panel:not(.faq-panel--marquee) .faq-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    observer.observe(el);
  });
}
