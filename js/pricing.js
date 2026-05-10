/* ══════════════════════════════════════════
   PRICING — Toggle + Boutons (+ i18n)
   ══════════════════════════════════════════ */

function syncPricingPeriodLabels() {
  const toggle       = document.getElementById("pricingToggle");
  const monthlyLabel = document.getElementById("monthlyLabel");
  const yearlyLabel  = document.getElementById("yearlyLabel");
  const prices       = document.querySelectorAll(".price-amount:not(.no-toggle)");
  const periods      = document.querySelectorAll(".price-period");
  const priceOld     = document.getElementById("priceOld");
  const priceSaving  = document.getElementById("priceSaving");

  if (!toggle) return;

  const yearly = toggle.classList.contains("active");
  const t = typeof window.FideliioT === "function" ? window.FideliioT : () => "";

  if (monthlyLabel) {
    monthlyLabel.textContent = t("pricing.toggle_monthly");
    monthlyLabel.classList.toggle("active", !yearly);
  }
  if (yearlyLabel) {
    const yTxt = yearlyLabel.querySelector(".toggle-yearly-text");
    const yPct = yearlyLabel.querySelector(".toggle-yearly-pct");
    if (yTxt) yTxt.textContent = t("pricing.toggle_yearly");
    if (yPct) yPct.textContent = t("pricing.discount_pct");
    yearlyLabel.classList.toggle("active", yearly);
  }

  prices.forEach(price => {
    price.textContent = yearly ? price.dataset.yearly : price.dataset.monthly;
  });

  periods.forEach(period => {
    const monthly = t("pricing.period") || "/mois";
    const yearlyBundle = t("pricing.period_yearly_bundle");
    period.textContent = yearly && yearlyBundle ? yearlyBundle : monthly;
  });

  if (priceOld)    priceOld.style.display    = yearly ? "inline" : "none";
  if (priceSaving) priceSaving.style.display = yearly ? "block"  : "none";
}

function initPricingToggle() {
  const toggle       = document.getElementById("pricingToggle");
  const monthlyLabel = document.getElementById("monthlyLabel");
  const yearlyLabel  = document.getElementById("yearlyLabel");

  if (!toggle) return;

  /* Libellés initiaux depuis le catalogue traduit */
  if (monthlyLabel) monthlyLabel.textContent = window.FideliioT("pricing.toggle_monthly");
  if (yearlyLabel) {
    const yTxt = yearlyLabel.querySelector(".toggle-yearly-text");
    const yPct = yearlyLabel.querySelector(".toggle-yearly-pct");
    if (yTxt) yTxt.textContent = window.FideliioT("pricing.toggle_yearly");
    if (yPct) yPct.textContent = window.FideliioT("pricing.discount_pct");
  }

  let yearly = false;

  toggle.addEventListener("click", () => {
    yearly = !yearly;
    toggle.classList.toggle("active", yearly);
    syncPricingPeriodLabels();
  });

  syncPricingPeriodLabels();
}

document.addEventListener("fideliio:lang", syncPricingPeriodLabels);

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
