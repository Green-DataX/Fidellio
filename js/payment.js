// Ouvre le modal avec les infos du plan
function openPayment(plan, price, icon) {
  document.getElementById('modalPlanName').textContent  = plan;
  document.getElementById('modalPlanPrice').textContent = price + ' DH / mois';
  document.getElementById('modalPlanIcon').textContent  = icon;
  document.getElementById('summaryPlan').textContent    = plan;
  document.getElementById('summaryTotal').textContent   = price + ' DH';

  // Reset formulaire
  document.querySelector('.payment-form').style.display = 'flex';
  document.getElementById('paymentSuccess').style.display = 'none';
  document.querySelector('.payment-form').reset();
  const btn = document.getElementById('payBtn');
  btn.disabled = false;
  btn.querySelector('#payBtnText').setAttribute('data-i18n','payment.pay');

  document.getElementById('paymentModal').classList.add('open');
  document.body.style.overflow = 'hidden';

  // Re-traduire le modal dans la langue courante
  const t = translations[currentLang];
  if (t) {
    document.querySelectorAll('#paymentModal [data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) el.textContent = t[key];
    });
  }
}

function closeModal() {
  document.getElementById('paymentModal').classList.remove('open');
  document.body.style.overflow = '';
}

function closeModalOutside(e) {
  if (e.target.id === 'paymentModal') closeModal();
}

// Fermer avec Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

/* ── Format numéro de carte : 1234 5678 9012 3456 ── */
function formatCardNumber(input) {
  let val = input.value.replace(/\D/g,'').substring(0,16);
  input.value = val.replace(/(.{4})/g,'$1 ').trim();
}

/* ── Format expiry : MM / AA ── */
function formatExpiry(input) {
  let val = input.value.replace(/\D/g,'').substring(0,4);
  if (val.length >= 3) {
    input.value = val.substring(0,2) + ' / ' + val.substring(2);
  } else {
    input.value = val;
  }
}

/* ── Soumission du formulaire ── */
function submitPayment(e) {
  e.preventDefault();

  const btn = document.getElementById('payBtn');
  const btnText = document.getElementById('payBtnText');
  btn.disabled = true;
  btnText.textContent = '⏳ Traitement...';

  // Simulation d'un appel API (2 secondes)
  setTimeout(() => {
    document.querySelector('.payment-form').style.display = 'none';
    document.getElementById('paymentSuccess').style.display = 'block';

    // Traduire le succès
    const t = translations[currentLang];
    if (t) {
      document.querySelectorAll('#paymentSuccess [data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
      });
    }
  }, 2000);
}
