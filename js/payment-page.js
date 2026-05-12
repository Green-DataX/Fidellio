/* ══════════════════════════════════════════
   PAGE DE PAIEMENT — Fideliio
   Supabase Auth + merchants + subscriptions
   ══════════════════════════════════════════ */

/* ── Config Supabase ── */
const SUPABASE_URL =
  'https://hdzhdwelgqmdvgwrlxud.supabase.co';
const SUPABASE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhkemhkd2VsZ3FtZHZnd3JseHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNTE4NDMsImV4cCI6MjA5MTkyNzg0M30.yR5dYEiSRg5lRzNvVD058SxGqFYvf2Ee64sGdobHbGw';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/* ── Config paiement ── */
const CONFIG = {
  WHATSAPP_NUM: '212600000000', // ← Remplace par ton vrai numéro
  EMAIL: 'contact@fideliio.com',
  PRIX_MENSUEL: 99,
  PRIX_ANNUEL: 82,
  PRIX_PROPLUS_MENSUEL: 189,
  PRIX_PROPLUS_ANNUEL: 150,
};

/* ── Plan depuis URL ── */
const params = new URLSearchParams(window.location.search);
const planParam = params.get('plan') || 'monthly';
const isProPlusPlan =
  planParam === 'proplus-monthly' || planParam === 'proplus-yearly';
const isYearly =
  planParam === 'yearly' ||
  planParam === 'proplus-yearly';

function TT(key) {
  return typeof window.FideliioT === 'function' ? window.FideliioT(key) : '';
}

function planPrice() {
  if (isProPlusPlan) {
    return isYearly ? CONFIG.PRIX_PROPLUS_ANNUEL : CONFIG.PRIX_PROPLUS_MENSUEL;
  }
  return isYearly ? CONFIG.PRIX_ANNUEL : CONFIG.PRIX_MENSUEL;
}

function periodSummaryTxt() {
  return isYearly ? TT('pricing.period_yearly_bundle') : TT('pricing.period');
}

function billingLbl() {
  return isYearly ? TT('pay.summary_billing_yearly') : TT('pay.summary_billing_monthly');
}

function currencyLbl() {
  return TT('pricing.currency') || 'DH';
}

function refreshPaymentPageTexts() {
  const p = planPrice();
  const amountEl = document.querySelector('.summary-amount');
  if (amountEl) amountEl.textContent = String(p);
  setText('summaryPeriod', periodSummaryTxt());
  setText('summaryBilling', billingLbl());
  const ttl = TT('pay.page_title');
  if (ttl) document.title = ttl;
}

document.addEventListener('fideliio:lang', refreshPaymentPageTexts);
document.addEventListener('fideliio:components-loaded', refreshPaymentPageTexts);

/* ══════════════════════════════
   CONNEXION
   ══════════════════════════════ */
async function handleLogin() {
  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  const btn = document.getElementById('loginBtn');
  const errorEl = document.getElementById('loginError');

  if (!email || !password) {
    showError(TT('pay.err_fill'));
    return;
  }

  btn.textContent = TT('pay.logging_in');
  btn.disabled = true;
  if (errorEl) errorEl.style.display = 'none';

  try {
    const { data: authData, error: authError } =
      await db.auth.signInWithPassword({ email, password });

    if (authError) throw new Error(authError.message);

    const userId = authData.user.id;

    const { data: merchant, error: merchantError } = await db
      .from('merchants')
      .select('id, business_name, email, subscription_started')
      .eq('user_id', userId)
      .maybeSingle();

    if (merchantError || !merchant) throw new Error(TT('pay.err_merchant'));

    const { data: subscription } = await db
      .from('subscriptions')
      .select('plan, status, started_at, expires_at')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    showDashboard({
      name: merchant.business_name || email.split('@')[0],
      email: merchant.email || email,
      merchantId: merchant.id,
      plan: subscription?.plan || 'trial',
      status: subscription?.status || 'inactive',
      expiresAt: subscription?.expires_at || null,
      history: [],
    });
  } catch (err) {
    let msg = TT('pay.err_credentials');
    if (String(err.message).includes('Invalid login credentials')) msg = TT('pay.err_credentials');
    if (String(err.message).includes('Email not confirmed')) msg = TT('pay.err_email_confirm');
    if (String(err.message).includes('Too many requests')) msg = TT('pay.err_rate');
    if (String(err.message).includes('introuvable')) msg = err.message;
    showError(msg);
  } finally {
    btn.textContent = TT('pay.login_btn_continue');
    btn.disabled = false;
  }
}

async function handleGoogleLogin() {
  const btn =
    document.getElementById('googleBtn') ??
    document.getElementById('googleBtnModal');
  const label = btn?.querySelector('.pay-google-label');
  const setLab = text => {
    if (label) label.textContent = text;
    else if (btn) btn.textContent = text;
  };
  const prev = label ? label.textContent : btn?.textContent;
  if (btn) btn.disabled = true;
  setLab(TT('pay.google_pending'));

  try {
    const { error } = await db.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
    if (error) throw error;
  } catch (_err) {
    showError(TT('pay.google_fail'));
    setLab(prev || TT('paym.google'));
    if (btn) btn.disabled = false;
  }
}

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
  const isPro = user.plan === 'pro';
  const isStarter = user.plan === 'starter';

  const pr = planPrice();
  const cur = currencyLbl();

  setText('dashAvatar', user.name?.charAt(0).toUpperCase() || '?');
  setText('dashName', user.name);
  setText('dashEmail', user.email);

  const planTag = document.getElementById('dashCurrentPlan');
  if (planTag) {
    planTag.textContent = isPro
      ? TT('pay.dash_plan_pro')
      : isStarter
        ? TT('pay.dash_plan_starter')
        : TT('pay.dash_plan_free');
    planTag.className = 'dash-page-plan ' + (isPro || isStarter ? 'pro' : '');
  }

  setText('dashPrice', String(pr));
  setText('dashPeriod', periodSummaryTxt());
  setText('dashBilling', billingLbl());
  setText('ribAmount', `${pr} ${cur}`);
  setText(
    'dashPlanCurrent',
    isPro ? TT('pricing.pro.name') : isStarter ? TT('pricing.free.name') : TT('pay.dash_plan_free')
  );

  const ref =
    'FID-' +
    new Date().getFullYear() +
    '-' +
    Math.random().toString(36).substr(2, 6).toUpperCase();
  setText('ribRef', ref);

  const renewDate = user.expiresAt
    ? new Date(user.expiresAt)
    : (() => {
        const d = new Date();
        d.setMonth(d.getMonth() + (isYearly ? 12 : 1));
        return d;
      })();
  const lng = document.documentElement.getAttribute('lang') || 'fr';
  setText(
    'dashRenewDate',
    renewDate.toLocaleDateString(
      lng === 'ar' ? 'ar-MA' : lng === 'en' ? 'en-GB' : 'fr-FR',
      { day: 'numeric', month: 'long', year: 'numeric' }
    )
  );

  const statusEl = document.getElementById('dashStatus');
  if (statusEl) {
    statusEl.textContent = isActive ? TT('pay.active_badge') : TT('pay.pending_pay');
    statusEl.className = 'dw-status-badge ' + (isActive ? 'active' : 'pending');
  }

  const hist = document.getElementById('dashHistory');
  if (hist) {
    hist.innerHTML = user.history?.length
      ? user.history
          .map(
            h => `
          <div class="dw-history-row">
            <span class="dw-h-date">${h.date}</span>
            <span class="dw-h-plan">${h.plan}</span>
            <span class="dw-h-amount">${h.amount} ${cur}</span>
            <span class="dw-h-status ${h.status}">${h.status === 'paid' ? TT('pay.hist_paid') : TT('pay.hist_pending')}</span>
          </div>`
          )
          .join('')
      : `<div class="dw-history-empty">${TT('pay.hist_empty')}</div>`;
  }

  const waMsg = encodeURIComponent(
    `Bonjour Fideliio 👋\n\n` +
      `Virement effectué pour le plan ${isPro ? 'Pro' : 'Starter'}.\n\n` +
      `Commerçant : ${user.name}\n` +
      `Email       : ${user.email}\n` +
      `ID          : ${user.merchantId}\n` +
      `Référence   : ${ref}\n` +
      `Montant     : ${pr} ${cur}\n\n` +
      `Merci d'activer mon compte.`
  );
  const mailSubj = encodeURIComponent(
    `Preuve paiement Plan ${isPro ? 'Pro' : 'Starter'} — ${ref}`
  );
  const mailBody = encodeURIComponent(
    `Bonjour,\n\nVirement effectué.\n\n` +
      `Commerçant : ${user.name}\n` +
      `Email       : ${user.email}\n` +
      `ID          : ${user.merchantId}\n` +
      `Référence   : ${ref}\n` +
      `Montant     : ${pr} ${cur}\n\nCordialement.`
  );

  const waLink = document.getElementById('waLink');
  const mailLink = document.getElementById('mailLink');
  if (waLink) waLink.href = `https://wa.me/${CONFIG.WHATSAPP_NUM}?text=${waMsg}`;
  if (mailLink)
    mailLink.href = `mailto:${CONFIG.EMAIL}?subject=${mailSubj}&body=${mailBody}`;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', async () => {
  refreshPaymentPageTexts();

  db.auth.onAuthStateChange(async (_event, session) => {
    if (!session) return;
    await loadMerchantSession(session);
  });

  const {
    data: { session },
  } = await db.auth.getSession();
  if (!session) return;

  await loadMerchantSession(session);
});

async function loadMerchantSession(session) {
  const userId = session.user.id;

  const { data: merchant } = await db
    .from('merchants')
    .select('id, business_name, email')
    .eq('user_id', userId)
    .maybeSingle();

  if (!merchant) {
    showError(TT('pay.err_merchant'));
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
    name: merchant.business_name || session.user.email.split('@')[0],
    email: merchant.email || session.user.email,
    merchantId: merchant.id,
    plan: subscription?.plan || 'trial',
    status: subscription?.status || 'inactive',
    expiresAt: subscription?.expires_at || null,
    history: [],
  });
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function showError(msg) {
  const el = document.getElementById('loginError');
  if (!el) return;
  const clean = String(msg).replace(/^❌\s*/, '');
  el.textContent = clean.startsWith('❌') ? clean : `❌ ${clean}`;
  el.style.display = 'block';
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
  const done = TT('pay.copied_btn').trim() || '✅';
  if (btn) {
    btn.textContent = done;
    setTimeout(() => (btn.textContent = TT('pay.copy_btn')), 2000);
  }
}

function copyRef() {
  const ref = document.getElementById('ribRef')?.textContent?.trim();
  if (!ref) return;
  navigator.clipboard.writeText(ref);
  const btn = document.querySelectorAll('.dw-copy-btn')[1];
  const done = TT('pay.copied_btn').trim() || '✅';
  if (btn) {
    btn.textContent = done;
    setTimeout(() => (btn.textContent = TT('pay.copy_btn')), 2000);
  }
}
