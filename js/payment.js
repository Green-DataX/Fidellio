/* ══════════════════════════════════════════
   PAYMENT — Flux professionnel
   ══════════════════════════════════════════ */

/* ── CONFIG — Remplacez par vos vraies valeurs ── */
const CONFIG = {
  API_URL:      "https://votre-api.com",   // ← URL de votre API
  WHATSAPP_NUM: "212XXXXXXXXX",            // ← Votre numéro WhatsApp
  EMAIL:        "contact@fideliio.com",    // ← Votre email
  APP_STORE:    "https://apps.apple.com/app/fideliio",
  PLAY_STORE:   "https://play.google.com/store/apps/fideliio",
  PRICE_MONTHLY: 99,
  PRICE_YEARLY:  82,
};

/* ── État global ── */
let currentUser = null;
let isYearly    = false;

/* ══════════════════════════════
   OUVRIR / FERMER
══════════════════════════════ */
function TT(key) {
  return typeof window.FideliioT === "function" ? window.FideliioT(key) : "";
}

function openPaymentModal() {
  /* Récupère si toggle annuel actif */
  const toggle = document.getElementById("pricingToggle");
  isYearly = toggle ? toggle.classList.contains("active") : false;

  const price  = isYearly ? CONFIG.PRICE_YEARLY  : CONFIG.PRICE_MONTHLY;
  const curr   = TT("pricing.currency") || "DH";
  const period = isYearly ? TT("pricing.period_badge_yearly") || "/mois · annuel" : TT("pricing.period") || "/mois";

  /* Met à jour le badge prix */
  const badge = document.getElementById("badgePriceChoice");
  if (badge) badge.textContent = `${price} ${curr}${period}`;

  /* Vérifie si déjà connecté */
  const saved = localStorage.getItem("fideliio_user");
  if (saved) {
    currentUser = JSON.parse(saved);
    showDashboard();
  } else {
    showStep("stepChoice");
  }

  document.getElementById("payModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closePayModal() {
  document.getElementById("payModal").classList.remove("active");
  document.body.style.overflow = "";
}

/* Ferme en cliquant dehors */
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("payModal");
  if (overlay) {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) closePayModal();
    });
  }
});

/* ══════════════════════════════
   NAVIGATION ENTRE ÉTAPES
══════════════════════════════ */
function showStep(stepId) {
  document.querySelectorAll(".pay-step").forEach(s => s.style.display = "none");
  const step = document.getElementById(stepId);
  if (step) step.style.display = "block";

  /* Scroll en haut */
  const box = document.getElementById("payBox");
  if (box) box.scrollTop = 0;
}

/* ══════════════════════════════
   TÉLÉCHARGEMENT APP
══════════════════════════════ */
function openAppDownload() {
  showStep("stepDownload");

  /* Met à jour les liens */
  const links = document.querySelectorAll(".dl-badge");
  if (links[0]) links[0].href = CONFIG.APP_STORE;
  if (links[1]) links[1].href = CONFIG.PLAY_STORE;
}

/* ══════════════════════════════
   CONNEXION
══════════════════════════════ */
async function handleLogin() {
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const btn      = document.getElementById("loginBtn");
  const error    = document.getElementById("loginError");

  if (!email || !password) {
    showLoginError(TT("pay.err_fill"));
    return;
  }

  /* État chargement */
  btn.textContent = TT("pay.logging_in");
  btn.disabled = true;
  error.style.display = "none";

  try {
    /* ── APPEL API ──
       Remplacez ce bloc par votre vraie API d'authentification
       Exemple Firebase :
         const res = await firebase.auth().signInWithEmailAndPassword(email, password);
         currentUser = { name: res.user.displayName, email: res.user.email, uid: res.user.uid };

       Exemple Node.js/JWT :
         const res = await fetch(`${CONFIG.API_URL}/auth/login`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ email, password })
         });
         const data = await res.json();
         if (!res.ok) throw new Error(data.message);
         currentUser = data.user;
         localStorage.setItem("fideliio_token", data.token);
    ── FIN APPEL API ── */

    /* SIMULATION (à remplacer par votre vraie API) */
    await simulateAPI(500);
    if (email === "test@test.com" && password === "123456") {
      currentUser = {
        name:    "Mohammed Alami",
        email:   email,
        plan:    "free",
        history: []
      };
    } else {
      throw new Error(TT("pay.err_credentials"));
    }
    /* FIN SIMULATION */

    localStorage.setItem("fideliio_user", JSON.stringify(currentUser));
    showDashboard();

  } catch (err) {
    showLoginError(err.message || TT("pay.err_credentials"));
  } finally {
    btn.textContent = TT("paym.login_btn");
    btn.disabled = false;
  }
}

function showLoginError(msg) {
  const error = document.getElementById("loginError");
  const clean = msg.replace(/^❌\s*/, "");
  error.textContent = clean.startsWith("❌") ? clean : `❌ ${clean}`;
  error.style.display = "block";
}

function simulateAPI(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function togglePassword() {
  const input = document.getElementById("loginPassword");
  input.type = input.type === "password" ? "text" : "password";
}

/* ══════════════════════════════
   DASHBOARD PERSONNALISÉ
══════════════════════════════ */
function showDashboard() {
  if (!currentUser) return;

  const price    = isYearly ? CONFIG.PRICE_YEARLY  : CONFIG.PRICE_MONTHLY;
  const curr     = TT("pricing.currency") || "DH";
  const billing  = isYearly ? TT("pay.summary_billing_yearly") : TT("pay.summary_billing_monthly");
  const periodTxt = isYearly ? TT("pricing.period_yearly_bundle") || TT("pricing.period_badge_yearly") : TT("pricing.period");

  /* Infos compte */
  const avatar = document.getElementById("dashAvatar");
  if (avatar) avatar.textContent = currentUser.name?.charAt(0).toUpperCase() || "?";

  setText("dashName",  currentUser.name  || "Commerçant");
  setText("dashEmail", currentUser.email || "");

  /* Plan actuel */
  const planTag = document.getElementById("dashPlanTag");
  if (planTag) {
    planTag.textContent =
      currentUser.plan === "pro" ? TT("pay.dash_plan_pro") : TT("pay.dash_plan_free");
    planTag.className    = "dash-plan-tag " + (currentUser.plan === "pro" ? "pro" : "free");
  }

  /* Prix plan */
  const priceEl = document.getElementById("dashPlanPrice");
  if (priceEl)
    priceEl.innerHTML =
      `${price} ${curr}<span>${periodTxt || ""}</span>`;
  setText("dashBilling", billing);

  /* Référence unique */
  const ref = "PRO-2026-" + Math.random().toString(36).substr(2,4).toUpperCase();
  setText("ribRef",    ref);
  setText("ribAmount", `${price} ${curr}`);

  /* Date renouvellement */
  const nextDate = new Date();
  nextDate.setMonth(nextDate.getMonth() + (isYearly ? 12 : 1));
  const loc = document.documentElement.getAttribute("lang") || "fr";
  setText(
    "renewDate",
    nextDate.toLocaleDateString(loc === "ar" ? "ar-MA" : loc === "en" ? "en-GB" : "fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  );

  /* Statut */
  const statusEl = document.getElementById("renewStatus");
  if (statusEl) {
    statusEl.textContent =
      currentUser.plan === "pro" ? TT("pay.active_badge") : TT("pay.pending_pay");
    statusEl.className    = "renew-status " + (currentUser.plan === "pro" ? "active" : "pending");
  }

  /* Historique */
  const history = document.getElementById("dashHistory");
  if (history) {
    if (currentUser.history && currentUser.history.length > 0) {
      history.innerHTML = currentUser.history.map(h => `
        <div class="history-row">
          <span class="history-date">${h.date}</span>
          <span class="history-plan">${h.plan}</span>
          <span class="history-amount">${h.amount} ${curr}</span>
          <span class="history-status ${h.status}">${h.status === "paid" ? TT("pay.hist_paid") : TT("pay.hist_pending")}</span>
        </div>
      `).join("");
    } else {
      history.innerHTML = `<div class="history-empty">${TT("pay.hist_empty_modal")}</div>`;
    }
  }

  /* Liens WhatsApp & Email */
  const waMsg = encodeURIComponent(
    `Bonjour Fideliio 👋\nJe viens d'effectuer le virement pour le Plan Pro.\n\nNom: ${currentUser.name}\nEmail: ${currentUser.email}\nRéférence: ${ref}\nMontant: ${price} ${curr}\n\nMerci de bien vouloir activer mon compte.`
  );
  const mailSubject = encodeURIComponent(`Preuve de paiement Plan Pro — ${ref}`);
  const mailBody    = encodeURIComponent(
    `Bonjour,\n\nJe viens d'effectuer le virement pour le Plan Pro.\n\nNom: ${currentUser.name}\nEmail: ${currentUser.email}\nRéférence: ${ref}\nMontant: ${price} ${curr}\n\nCordialement.`
  );

  const waLink   = document.getElementById("waLink");
  const mailLink = document.getElementById("mailLink");
  if (waLink)   waLink.href   = `https://wa.me/${CONFIG.WHATSAPP_NUM}?text=${waMsg}`;
  if (mailLink) mailLink.href = `mailto:${CONFIG.EMAIL}?subject=${mailSubject}&body=${mailBody}`;

  showStep("stepDashboard");
}

/* ══════════════════════════════
   DÉCONNEXION
══════════════════════════════ */
function handleLogout() {
  currentUser = null;
  localStorage.removeItem("fideliio_user");
  localStorage.removeItem("fideliio_token");
  showStep("stepChoice");
}

/* ══════════════════════════════
   COPIER RIB
══════════════════════════════ */
function copyRIB() {
  const rib = document.getElementById("ribVal")?.textContent;
  if (!rib) return;
  navigator.clipboard.writeText(rib.trim());
  const btn = document.querySelector(".copy-rib-btn");
  if (btn) {
    btn.textContent = "✅";
    setTimeout(() => (btn.textContent = "📋"), 2000);
  }
}

/* ══════════════════════════════
   UTILITAIRE
══════════════════════════════ */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/* ══════════════════════════════
   INIT — Attendre le loader
══════════════════════════════ */
setTimeout(() => {
  /* Met à jour le bouton Pro dans pricing */
  const proBtn = document.querySelector(".pricing-btn.primary");
  if (proBtn) proBtn.onclick = openPaymentModal;
}, 400);

document.addEventListener("fideliio:lang", () => {
  const modal = document.getElementById("payModal");
  if (!modal || !modal.classList.contains("active")) return;
  if (typeof currentUser !== "undefined" && currentUser != null) showDashboard();
  else openPaymentModal();
});