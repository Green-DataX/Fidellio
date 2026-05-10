/* ══════════════════════════════════════════
   PAYMENT PAGE — Supabase Auth
   Tables : merchants + subscriptions
   ══════════════════════════════════════════ */

/* ── Config Supabase ── */
const SUPABASE_URL  = 'https://hdzhdwelgqmdvgwrlxud.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhkemhkd2VsZ3FtZHZnd3JseHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNTE4NDMsImV4cCI6MjA5MTkyNzg0M30.yR5dYEiSRg5lRzNvVD058SxGqFYvf2Ee64sGdobHbGw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/* ── Config paiement ── */
const CONFIG = {
  WHATSAPP_NUM:  "212XXXXXXXXX",
  EMAIL:         "contact@fideliio.com",
  PRICE_MONTHLY: 99,
  PRICE_YEARLY:  82,
};

/* ── Plan depuis URL ── */
const params   = new URLSearchParams(window.location.search);
const isYearly = params.get("plan") === "yearly";
const price    = isYearly ? CONFIG.PRICE_YEARLY  : CONFIG.PRICE_MONTHLY;
const period   = isYearly ? "/mois · annuel"      : "/mois";
const billing  = isYearly ? "Facturation annuelle" : "Facturation mensuelle";

/* ══════════════════════════════
   CONNEXION
══════════════════════════════ */
async function handleLogin() {
  const email   = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value;
  const btn     = document.getElementById("loginBtn");
  const errorEl = document.getElementById("loginError");

  if (!email || !password) { showError("Veuillez remplir tous les champs."); return; }

  btn.textContent = "Connexion en cours...";
  btn.disabled    = true;
  if (errorEl) errorEl.style.display = "none";

  try {
    /* 1. Auth Supabase */
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw new Error(authError.message);

    const userId = authData.user.id;

    /* 2. Profil merchant */
    const { data: merchant, error: merchantError } = await supabase
      .from("merchants")
      .select("id, business_name, email, subscription_started")
      .eq("user_id", userId)
      .single();

    if (merchantError || !merchant) {
      throw new Error("Compte commerçant introuvable. Vérifiez que vous avez un compte sur l'application Fideliio.");
    }

    /* 3. Abonnement */
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan, status, started_at, expires_at")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    showDashboard({
      name:       merchant.business_name || email.split("@")[0],
      email:      merchant.email || email,
      merchantId: merchant.id,
      plan:       subscription?.plan   || "free",
      status:     subscription?.status || "inactive",
      expiresAt:  subscription?.expires_at || null,
      history:    []
    });

  } catch (err) {
    let msg = "Email ou mot de passe incorrect.";
    if (err.message.includes("Invalid login credentials")) msg = "Email ou mot de passe incorrect.";
    if (err.message.includes("Email not confirmed"))       msg = "Veuillez confirmer votre email.";
    if (err.message.includes("Too many requests"))         msg = "Trop de tentatives. Réessayez plus tard.";
    if (err.message.includes("introuvable"))               msg = err.message;
    showError(msg);
  } finally {
    btn.textContent = "Se connecter et continuer →";
    btn.disabled    = false;
  }
}

/* ── Déconnexion ── */
async function handleLogout() {
  await supabase.auth.signOut();
  document.getElementById("sectionAuth")?.style.removeProperty("display");
  document.getElementById("sectionDashboard")?.style.setProperty("display", "none");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ══════════════════════════════
   DASHBOARD
══════════════════════════════ */
function showDashboard(user) {
  document.getElementById("sectionAuth")?.style.setProperty("display", "none");
  document.getElementById("sectionDashboard")?.style.setProperty("display", "block");

  const isPro = user.plan === "pro" || user.status === "active";

  setText("dashAvatar", user.name?.charAt(0).toUpperCase() || "?");
  setText("dashName",   user.name);
  setText("dashEmail",  user.email);

  const planTag = document.getElementById("dashCurrentPlan");
  if (planTag) {
    planTag.textContent = isPro ? "Pro ✓" : "Gratuit";
    planTag.className   = "dash-page-plan " + (isPro ? "pro" : "");
  }

  setText("dashPrice",        price);
  setText("dashPeriod",       period);
  setText("dashBilling",      billing);
  setText("ribAmount",        `${price} DH`);
  setText("dashPlanCurrent",  isPro ? "Pro" : "Gratuit");

  /* Référence unique */
  const ref = "PRO-" + new Date().getFullYear() + "-" +
              Math.random().toString(36).substr(2, 4).toUpperCase();
  setText("ribRef", ref);

  /* Date renouvellement */
  const renewDate = user.expiresAt
    ? new Date(user.expiresAt)
    : (() => { const d = new Date(); d.setMonth(d.getMonth() + (isYearly ? 12 : 1)); return d; })();
  setText("dashRenewDate", renewDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }));

  /* Statut */
  const statusEl = document.getElementById("dashStatus");
  if (statusEl) {
    statusEl.textContent = isPro ? "✅ Actif" : "⏳ En attente de paiement";
    statusEl.className   = "dw-status-badge " + (isPro ? "active" : "pending");
  }

  /* Historique */
  const hist = document.getElementById("dashHistory");
  if (hist) {
    hist.innerHTML = user.history?.length
      ? user.history.map(h => `
          <div class="dw-history-row">
            <span class="dw-h-date">${h.date}</span>
            <span class="dw-h-plan">${h.plan}</span>
            <span class="dw-h-amount">${h.amount} DH</span>
            <span class="dw-h-status ${h.status}">${h.status === "paid" ? "✅ Payé" : "⏳ En attente"}</span>
          </div>`).join("")
      : '<div class="dw-history-empty">Aucun paiement enregistré.</div>';
  }

  /* WhatsApp & Email */
  const waMsg = encodeURIComponent(
    `Bonjour Fideliio 👋\n\nVirement Plan Pro effectué.\n\n` +
    `Commerçant : ${user.name}\nEmail : ${user.email}\nID : ${user.merchantId}\n` +
    `Référence : ${ref}\nMontant : ${price} DH\n\nMerci d'activer mon compte.`
  );
  const mailSubj = encodeURIComponent(`Preuve paiement Plan Pro — ${ref}`);
  const mailBody = encodeURIComponent(
    `Bonjour,\n\nVirement Plan Pro effectué.\n\n` +
    `Commerçant : ${user.name}\nEmail : ${user.email}\nID : ${user.merchantId}\n` +
    `Référence : ${ref}\nMontant : ${price} DH\n\nCordialement.`
  );

  const waLink   = document.getElementById("waLink");
  const mailLink = document.getElementById("mailLink");
  if (waLink)   waLink.href   = `https://wa.me/${CONFIG.WHATSAPP_NUM}?text=${waMsg}`;
  if (mailLink) mailLink.href = `mailto:${CONFIG.EMAIL}?subject=${mailSubj}&body=${mailBody}`;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ══════════════════════════════
   INIT
══════════════════════════════ */
document.addEventListener("DOMContentLoaded", async () => {
  setText("summaryPeriod",  period);
  setText("summaryBilling", billing);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const userId = session.user.id;

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, business_name, email")
    .eq("user_id", userId)
    .single();

  if (!merchant) return;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status, expires_at")
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  showDashboard({
    name:       merchant.business_name || session.user.email.split("@")[0],
    email:      merchant.email || session.user.email,
    merchantId: merchant.id,
    plan:       subscription?.plan   || "free",
    status:     subscription?.status || "inactive",
    expiresAt:  subscription?.expires_at || null,
    history:    []
  });
});

/* ── Utilitaires ── */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function showError(msg) {
  const el = document.getElementById("loginError");
  if (el) { el.textContent = "❌ " + msg; el.style.display = "block"; }
}

function togglePassword() {
  const input = document.getElementById("loginPassword");
  if (input) input.type = input.type === "password" ? "text" : "password";
}

function copyRIB() {
  const rib = document.getElementById("ribVal")?.textContent?.trim();
  if (!rib) return;
  navigator.clipboard.writeText(rib);
  const btn = document.querySelectorAll(".dw-copy-btn")[0];
  if (btn) { btn.textContent = "✅ Copié !"; setTimeout(() => btn.textContent = "📋 Copier", 2000); }
}

function copyRef() {
  const ref = document.getElementById("ribRef")?.textContent?.trim();
  if (!ref) return;
  navigator.clipboard.writeText(ref);
  const btn = document.querySelectorAll(".dw-copy-btn")[1];
  if (btn) { btn.textContent = "✅ Copié !"; setTimeout(() => btn.textContent = "📋 Copier", 2000); }
}