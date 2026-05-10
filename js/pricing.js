/* ══════════════════════════════════════════
   PRICING — Toggle + Boutons
   ══════════════════════════════════════════ */

function initPricingToggle() {
  const toggle       = document.getElementById("pricingToggle");
  const monthlyLabel = document.getElementById("monthlyLabel");
  const yearlyLabel  = document.getElementById("yearlyLabel");
  const prices       = document.querySelectorAll(".price-amount:not(.no-toggle)");
  const periods      = document.querySelectorAll(".price-period");
  const priceOld     = document.getElementById("priceOld");
  const priceSaving  = document.getElementById("priceSaving");

  if (!toggle) return;

  let yearly = false;

  toggle.addEventListener("click", () => {
    yearly = !yearly;

    toggle.classList.toggle("active", yearly);
    monthlyLabel.classList.toggle("active", !yearly);
    yearlyLabel.classList.toggle("active", yearly);

    prices.forEach(price => {
      price.textContent = yearly ? price.dataset.yearly : price.dataset.monthly;
    });

    periods.forEach(period => {
      period.textContent = yearly ? "/mois · facturé annuellement" : "/mois";
    });

    if (priceOld)    priceOld.style.display    = yearly ? "inline" : "none";
    if (priceSaving) priceSaving.style.display = yearly ? "block"  : "none";
  });
}

/* ── Bouton Pro ── */
function initProBtn() {
  const proBtn = document.getElementById("proBtnMain");
  if (!proBtn) return;

  proBtn.onclick = () => {
    const yearly = document.getElementById("pricingToggle")?.classList.contains("active");
    window.location.href = `components/paiement.html?plan=${yearly ? "yearly" : "monthly"}`;
  };
}

/* ── Bouton Gratuit ── */
function initFreeBtn() {
  const freeBtn = document.querySelector(".pricing-btn.outline");
  if (!freeBtn) return;
  freeBtn.onclick = openFreeModal;
}

/* ── Modal Gratuit ── */
function openFreeModal() {
  const modal = document.getElementById('freeModal');
  if (!modal) return;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeFreeModal() {
  const modal = document.getElementById('freeModal');
  if (!modal) return;
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

/* ── Init après chargement loader ── */
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    initPricingToggle();
    initProBtn();
    initFreeBtn();
  }, 400);
});