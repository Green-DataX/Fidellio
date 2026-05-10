/* ══════════════════════════════════════════
   PAGE DE PAIEMENT — Fideliio
   Supabase Auth + merchants + subscriptions
   ══════════════════════════════════════════ */

/* ── Config Supabase ── */
const SUPABASE_URL  = 'https://hdzhdwelgqmdvgwrlxud.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhkemhkd2VsZ3FtZHZnd3JseHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNTE4NDMsImV4cCI6MjA5MTkyNzg0M30.yR5dYEiSRg5lRzNvVD058SxGqFYvf2Ee64sGdobHbGw';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/* ── Config paiement ── */
const CONFIG = {
  WHATSAPP_NUM : '212600000000',       // ← Remplace par ton vrai numéro
  EMAIL        : 'contact@fideliio.com',
  PRIX_MENSUEL : 99,
  PRIX_ANNUEL  : 82,
};

/* ── Plan depuis URL ── */
const params   = new URLSearchParams(window.location.search);
const isYearly = params.get('plan') === 'yearly';
const price    = isYearly ? CONFIG.PRIX_ANNUEL  : CONFIG.PRIX_MENSUEL;
const period   = isYearly ? '/mois · annuel'    : '/mois';
const billing  = isYearly ? 'Facturation annuelle (×12)' : 'Facturation mensuelle';

const amountEl = document.querySelector('.summary-amount');
if (amountEl) amountEl.textContent = price;

/* ══════════════════════════════
   CONNEXION
   ══════════════════════════════ */
async function handleLogin() {
  const email    = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  const btn      = document.getElementById('loginBtn');
  const errorEl  = document.getElementById('loginError');

  if (!email || !password) { showError('Veuillez remplir tous les champs.'); return; }

  btn.textContent = 'Connexion en cours...';
  btn.disabled    = true;
  if (errorEl) errorEl.style.display = 'none';

  try {
    /* 1. Authentification Supabase */
    const { data: authData, error: authError } =
      await db.auth.signInWithPassword({ email, password });

    if (authError) throw new Error(authError.message);

    const userId = authData.user.id;

    /* 2. Profil commerçant */
    const { data: merchant, error: merchantError } = await db
      .from('merchants')
      .select('id, business_name, email, subscription_started')
      .eq('user_id', userId)
      .maybeSingle();

    if (merchantError || !merchant) {
      throw new Error(
        "Compte commerçant introuvable. Vérifiez que vous avez un compte sur l'application Fideliio."
      );
    }

    /* 3. Abonnement */
    const { data: subscription } = await db
      .from('subscriptions')
      .select('plan, status, started_at, expires_at')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    showDashboard({
      name       : merchant.business_name || email.split('@')[0],
      email      : merchant.email || email,
      merchantId : merchant.id,
      plan       : subscription?.plan   || 'trial',
      status     : subscription?.status || 'inactive',
      expiresAt  : subscription?.expires_at || null,
      history    : [],
    });

  } catch (err) {
    let msg = 'Email ou mot de passe incorrect.';
    if (err.message.includes('Invalid login credentials')) msg = 'Email ou mot de passe incorrect.';
    if (err.message.includes('Email not confirmed'))       msg = 'Veuillez confirmer votre email.';
    if (err.message.includes('Too many requests'))         msg = 'Trop de tentatives. Réessayez plus tard.';
    if (err.message.includes('introuvable'))               msg = err.message;
    showError(msg);
  } finally {
    btn.textContent = 'Se connecter et continuer →';
    btn.disabled    = false;
  }
}


/* ── Connexion Google ── */
async function handleGoogleLogin() {
  const btn = document.getElementById('googleBtn');
  if (btn) { btn.textContent = 'Connexion...'; btn.disabled = true; }

  try {
    const { error } = await db.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href, // Revient sur la même page après auth
      }
    });
    if (error) throw error;
  } catch (err) {
    showError('Impossible de se connecter avec Google.');
    if (btn) { btn.textContent = 'Continuer avec Google'; btn.disabled = false; }
  }
}

/* ── Déconnexion ── */
async function handleLogout() {
  await db.auth.signOut();
  document.getElementById('sectionAuth')?.style.removeProperty('display');
  document.getElementById('sectionDashboard')?.style.setProperty('display', 'none');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ══════════════════════════════
   TABLEAU DE BORD
   ══════════════════════════════ */
function showDashboard(user) {
  document.getElementById('sectionAuth')?.style.setProperty('display', 'none');
  document.getElementById('sectionDashboard')?.style.setProperty('display', 'block');

  const isActive = user.status === 'active';
  const isPro    = user.plan === 'pro';
  const isStarter = user.plan === 'starter';

  /* Infos utilisateur */
  setText('dashAvatar',  user.name?.charAt(0).toUpperCase() || '?');
  setText('dashName',    user.name);
  setText('dashEmail',   user.email);

  /* Badge plan */
  const planTag = document.getElementById('dashCurrentPlan');
  if (planTag) {
    planTag.textContent = isPro ? 'Pro ✓' : isStarter ? 'Starter ✓' : 'Gratuit';
    planTag.className   = 'dash-plan-badge ' + (isPro || isStarter ? 'active' : '');
  }

  /* Prix */
  setText('dashPrice',   price);
  setText('dashPeriod',  period);
  setText('dashBilling', billing);
  setText('ribAmount',   `${price} DH`);
  setText('dashPlanCurrent', isPro ? 'Pro' : isStarter ? 'Starter' : 'Gratuit');

  /* Référence unique paiement */
  const ref = 'FID-' + new Date().getFullYear() + '-' +
    Math.random().toString(36).substr(2, 6).toUpperCase();
  setText('ribRef', ref);

  /* Date renouvellement */
  const renewDate = user.expiresAt
    ? new Date(user.expiresAt)
    : (() => {
        const d = new Date();
        d.setMonth(d.getMonth() + (isYearly ? 12 : 1));
        return d;
      })();
  setText('dashRenewDate', renewDate.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  }));

  /* Statut */
  const statusEl = document.getElementById('dashStatus');
  if (statusEl) {
    statusEl.textContent = isActive
      ? '✅ Actif'
      : '⏳ En attente de paiement';
    statusEl.className = 'dw-status-badge ' + (isActive ? 'active' : 'pending');
  }

  /* Historique */
  const hist = document.getElementById('dashHistory');
  if (hist) {
    hist.innerHTML = user.history?.length
      ? user.history.map(h => `
          <div class="dw-history-row">
            <span class="dw-h-date">${h.date}</span>
            <span class="dw-h-plan">${h.plan}</span>
            <span class="dw-h-amount">${h.amount} DH</span>
            <span class="dw-h-status ${h.status}">${h.status === 'paid' ? '✅ Payé' : '⏳ En attente'}</span>
          </div>`).join('')
      : '<div class="dw-history-empty">Aucun paiement enregistré.</div>';
  }

  /* Liens WhatsApp & Email */
  const waMsg = encodeURIComponent(
    `Bonjour Fideliio 👋\n\n` +
    `Virement effectué pour le plan ${isPro ? 'Pro' : 'Starter'}.\n\n` +
    `Commerçant : ${user.name}\n` +
    `Email       : ${user.email}\n` +
    `ID          : ${user.merchantId}\n` +
    `Référence   : ${ref}\n` +
    `Montant     : ${price} DH\n\n` +
    `Merci d'activer mon compte.`
  );
  const mailSubj = encodeURIComponent(`Preuve paiement Plan ${isPro ? 'Pro' : 'Starter'} — ${ref}`);
  const mailBody = encodeURIComponent(
    `Bonjour,\n\nVirement effectué.\n\n` +
    `Commerçant : ${user.name}\n` +
    `Email       : ${user.email}\n` +
    `ID          : ${user.merchantId}\n` +
    `Référence   : ${ref}\n` +
    `Montant     : ${price} DH\n\nCordialement.`
  );

  const waLink   = document.getElementById('waLink');
  const mailLink = document.getElementById('mailLink');
  if (waLink)   waLink.href   = `https://wa.me/${CONFIG.WHATSAPP_NUM}?text=${waMsg}`;
  if (mailLink) mailLink.href = `mailto:${CONFIG.EMAIL}?subject=${mailSubj}&body=${mailBody}`;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ══════════════════════════════
   INIT — Session existante
   ══════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  setText('summaryPeriod',  period);
  setText('summaryBilling', billing);

  // ✅ Écouter les changements de session (inclut le retour OAuth Google)
  db.auth.onAuthStateChange(async (_event, session) => {
    if (!session) return;
    await loadMerchantSession(session);
  });

  const { data: { session } } = await db.auth.getSession();
  if (!session) return;

  await loadMerchantSession(session);
});

/* ── Charger les données commerçant depuis une session ── */
async function loadMerchantSession(session) {
  const userId = session.user.id;

  const { data: merchant } = await db
    .from('merchants')
    .select('id, business_name, email')
    .eq('user_id', userId)
    .maybeSingle();

  if (!merchant) {
    showError(
      "Compte commerçant introuvable. " +
      "Vérifiez que vous avez un compte sur l'application Fideliio."
    );
    return;
  }

  const { data: subscription } = await db
    .from('subscriptions')
    .select('plan, status, expires_at')
    .eq('merchant_id', merchant.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  showDashboard({
    name       : merchant.business_name || session.user.email.split('@')[0],
    email      : merchant.email || session.user.email,
    merchantId : merchant.id,
    plan       : subscription?.plan      || 'trial',
    status     : subscription?.status    || 'inactive',
    expiresAt  : subscription?.expires_at || null,
    history    : [],
  });
}

/* ══════════════════════════════
   UTILITAIRES
   ══════════════════════════════ */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function showError(msg) {
  const el = document.getElementById('loginError');
  if (el) { el.textContent = '❌ ' + msg; el.style.display = 'block'; }
}

function togglePassword() {
  const input = document.getElementById('loginPassword');
  if (input) input.type = input.type === 'password' ? 'text' : 'password';
}

function copyRIB() {
  const rib = document.getElementById('ribVal')?.textContent?.trim();
  if (!rib) return;
  navigator.clipboard.writeText(rib);
  const btn = document.querySelectorAll('.dw-copy-btn')[0];
  if (btn) { btn.textContent = '✅ Copié !'; setTimeout(() => btn.textContent = '📋 Copier', 2000); }
}

function copyRef() {
  const ref = document.getElementById('ribRef')?.textContent?.trim();
  if (!ref) return;
  navigator.clipboard.writeText(ref);
  const btn = document.querySelectorAll('.dw-copy-btn')[1];
  if (btn) { btn.textContent = '✅ Copié !'; setTimeout(() => btn.textContent = '📋 Copier', 2000); }
}