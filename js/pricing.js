/* ══════════════════════════════════════════
   PRICING TOGGLE — Mensuel / Annuel
   ══════════════════════════════════════════ */

function initPricingToggle() {
  const toggle       = document.getElementById("pricingToggle");
  const monthlyLabel = document.getElementById("monthlyLabel");
  const yearlyLabel  = document.getElementById("yearlyLabel");
  //const prices       = document.querySelectorAll(".price-amount");
  const prices = document.querySelectorAll(".price-amount:not(.no-toggle)");
  const periods      = document.querySelectorAll(".price-period");

  if (!toggle) return; /* sécurité si l'élément n'existe pas encore */

  let yearly = false;

  toggle.addEventListener("click", () => {
    yearly = !yearly;

    toggle.classList.toggle("active", yearly);

    monthlyLabel.classList.toggle("active", !yearly);
    yearlyLabel.classList.toggle("active", yearly);

    prices.forEach(price => {
      price.textContent = yearly
        ? price.dataset.yearly
        : price.dataset.monthly;
    });

    periods.forEach(period => {
      period.textContent = yearly ? "/an" : "/mois";
    });
  });
}

/* ── Attend que le loader ait injecté tous les composants ── */
document.addEventListener("DOMContentLoaded", () => {
  /* Si votre loader.js émet un event custom, écoutez-le ici */
  /* Sinon on attend un court délai pour que les includes soient chargés */
  setTimeout(initPricingToggle, 300);
});
function initPricingToggle() {
  const toggle       = document.getElementById("pricingToggle");
  const monthlyLabel = document.getElementById("monthlyLabel");
  const yearlyLabel  = document.getElementById("yearlyLabel");
  const prices       = document.querySelectorAll(".price-amount");
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

    /* ── Affiche/cache le prix barré et l'économie ── */
    if (priceOld) {
      priceOld.style.display = yearly ? "inline" : "none";
    }
    if (priceSaving) {
      priceSaving.style.display = yearly ? "block" : "none";
    }
  });
}

setTimeout(initPricingToggle, 300);

setTimeout(() => {
  const proBtn = document.getElementById("proBtnMain");
  if (proBtn) {
    proBtn.onclick = () => {
      const yearly = document.getElementById("pricingToggle")?.classList.contains("active");
      window.location.href = `components/paiement.html?plan=${yearly ? "yearly" : "monthly"}`;
    };
  }
}, 400);