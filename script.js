/* ═══════════════════════════════════════════════════════════════
   AIDEN WILLIAMS — SITE SCRIPT v2.0
   Theme · Cursor glow · Nav (desktop + mobile) · Scroll reveal
   Smooth scroll · Active nav · Payment modal · Toast system
═══════════════════════════════════════════════════════════════ */

/* ── 1. THEME TOGGLE (persisted) ── */
const htmlEl   = document.documentElement;
const themeBtn = document.getElementById('themeBtn');
let isDark = localStorage.getItem('aw-theme') !== 'light';

function applyTheme(dark) {
  htmlEl.setAttribute('data-theme', dark ? 'dark' : 'light');
  if (themeBtn) themeBtn.textContent = dark ? '🌙' : '☀️';
}
applyTheme(isDark);

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    isDark = !isDark;
    applyTheme(isDark);
    localStorage.setItem('aw-theme', isDark ? 'dark' : 'light');
  });
}

/* ── 2. CURSOR GLOW (pointer devices only) ── */
const cglow = document.getElementById('cglow');
if (cglow && window.matchMedia('(pointer:fine)').matches) {
  document.addEventListener('mousemove', e => {
    cglow.style.opacity = '1';
    cglow.style.left = e.clientX + 'px';
    cglow.style.top  = e.clientY + 'px';
  });
  document.addEventListener('mouseleave', () => cglow.style.opacity = '0');
}

/* ── 3. MOBILE NAV ── */
const burger = document.getElementById('navBurger');
const drawer = document.getElementById('navDrawer');

if (burger && drawer) {
  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    drawer.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close on link click
  drawer.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      drawer.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (burger.classList.contains('open') && !drawer.contains(e.target) && !burger.contains(e.target)) {
      burger.classList.remove('open');
      drawer.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}

/* ── 4. SMOOTH SCROLL ── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ── 5. SCROLL-REVEAL (exp cards) ── */
const revealIO = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('vis'), i * 110);
      revealIO.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.exp-card').forEach(el => revealIO.observe(el));

/* ── 6. ACTIVE NAV HIGHLIGHT ── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.navbar__links li a, .navbar__drawer ul a');

const navIO = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => a.classList.remove('on'));
      document.querySelectorAll(`.navbar__links li a[href="#${entry.target.id}"], .navbar__drawer ul a[href="#${entry.target.id}"]`)
        .forEach(a => a.classList.add('on'));
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => navIO.observe(s));

/* ═══════════════════════════════════════════════════════════════
   PAYMENT SYSTEM
═══════════════════════════════════════════════════════════════ */

const PAYSTACK_PK = 'pk_test_5f706f00affbada9fe98f82a0b73ad3eac77d4e8';

// State
let payState = {
  plan:     '',
  amount:   0,   // in kobo (ZAR cents × 100)
  isCustom: false,
  method:   'card'
};

/* ── Open modal for fixed plans ── */
function openPayment(planName, amountKobo) {
  payState.plan     = planName;
  payState.amount   = amountKobo;
  payState.isCustom = false;

  document.getElementById('payBadge').textContent    = planName;
  document.getElementById('payAmount').textContent   = formatZAR(amountKobo / 100);
  document.getElementById('payAmountNote').textContent = '(sandbox / test mode)';
  document.getElementById('customAmountField').style.display = 'none';

  clearErrors();
  openModal();
}

/* ── Open modal for custom amount ── */
function openCustomPayment() {
  payState.plan     = 'Custom Project';
  payState.amount   = 0;
  payState.isCustom = true;

  document.getElementById('payBadge').textContent    = 'Custom Project';
  document.getElementById('payAmount').textContent   = 'R —';
  document.getElementById('payAmountNote').textContent = 'Enter your amount below';
  document.getElementById('customAmountField').style.display = 'block';
  document.getElementById('customAmountInput').value = '';

  clearErrors();
  openModal();
}

/* ── Modal open/close ── */
function openModal() {
  const overlay = document.getElementById('payOverlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  // Focus first input
  setTimeout(() => {
    const first = overlay.querySelector('input');
    if (first) first.focus();
  }, 300);
}

function closePayment() {
  document.getElementById('payOverlay').classList.remove('open');
  document.body.style.overflow = '';
  resetSubmitBtn();
}

/* ── Payment method selector ── */
function selectMethod(el) {
  document.querySelectorAll(".pay-method-btn").forEach(b => b.setAttribute("aria-pressed", "false"));
  document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  payState.method = el.dataset.method;
}

/* ── Form validation helpers ── */
function setFieldError(fieldId, msg) {
  const field = document.getElementById(fieldId).closest('.form-field');
  field.classList.add('has-error');
  field.querySelector('.form-error').textContent = msg;
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId).closest('.form-field');
  if (field) field.classList.remove('has-error');
}

function clearErrors() {
  document.querySelectorAll('.form-field.has-error').forEach(f => f.classList.remove('has-error'));
}

function validateForm() {
  let valid = true;
  clearErrors();

  const name  = document.getElementById('payName').value.trim();
  const email = document.getElementById('payEmail').value.trim();

  if (!name || name.length < 2) {
    setFieldError('payName', 'Please enter your full name.');
    valid = false;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError('payEmail', 'Please enter a valid email address.');
    valid = false;
  }

  if (payState.isCustom) {
    const raw = parseFloat(document.getElementById('customAmountInput').value);
    if (!raw || raw < 5) {
      setFieldError('customAmountInput', 'Minimum amount is R5.');
      valid = false;
    } else {
      payState.amount = Math.round(raw * 100);
      document.getElementById('payAmount').textContent = formatZAR(raw);
    }
  }

  return valid;
}

/* ── Submit payment ── */
function submitPayment() {
  if (!validateForm()) return;

  const name  = document.getElementById('payName').value.trim();
  const email = document.getElementById('payEmail').value.trim();

  setSubmitLoading(true);

  // Map method to Paystack channels
  const channelMap = {
    card:          ['card'],
    bank_transfer: ['bank_transfer'],
    qr:            ['qr'],
    ussd:          ['ussd'],
    mobile_money:  ['mobile_money']
  };

  const handler = PaystackPop.setup({
    key:      PAYSTACK_PK,
    email:    email,
    amount:   payState.amount,
    currency: 'ZAR',
    ref:      'AW-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
    label:    name,
    channels: channelMap[payState.method] || ['card'],
    metadata: {
      custom_fields: [
        { display_name: 'Service',     variable_name: 'service',     value: payState.plan },
        { display_name: 'Client Name', variable_name: 'client_name', value: name },
        { display_name: 'Method',      variable_name: 'method',      value: payState.method }
      ]
    },
    onClose: function() {
      setSubmitLoading(false);
      showToast('info', '⚠️', 'Payment cancelled', 'You closed the payment window. No charge was made.');
    },
    callback: function(response) {
      setSubmitLoading(false);
      closePayment();
      showToast(
        'success',
        '✅',
        'Payment successful!',
        `${name} — ${payState.plan} confirmed.`,
        'Ref: ' + response.reference
      );
      // Log for debugging in test mode
      console.log('[Paystack] Payment success:', response);
    }
  });

  handler.openIframe();
}

/* ── Submit button state ── */
function setSubmitLoading(loading) {
  const btn = document.getElementById('paySubmit');
  if (!btn) return;
  btn.disabled = loading;
  btn.classList.toggle('loading', loading);
}

function resetSubmitBtn() {
  setSubmitLoading(false);
}

/* ── Format ZAR currency ── */
function formatZAR(amount) {
  return 'R ' + Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/* ── TOAST NOTIFICATION SYSTEM ── */
let toastTimer = null;

function showToast(type, icon, title, msg, ref) {
  // Remove existing
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  if (toastTimer) clearTimeout(toastTimer);

  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.setAttribute('role', 'alert');
  t.setAttribute('aria-live', 'polite');
  t.innerHTML = `
    <div class="toast__icon">${icon}</div>
    <div class="toast__body">
      <div class="toast__title">${title}</div>
      <div class="toast__msg">${msg}</div>
      ${ref ? `<div class="toast__ref">${ref}</div>` : ''}
    </div>`;

  document.body.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));

  toastTimer = setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 400);
  }, 7000);

  t.addEventListener('click', () => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 400);
  });
}

/* ── Backdrop click closes modal ── */
const payOverlay = document.getElementById('payOverlay');
if (payOverlay) {
  payOverlay.addEventListener('click', e => {
    if (e.target === payOverlay) closePayment();
  });
}

/* ── Escape key closes modal ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && payOverlay && payOverlay.classList.contains('open')) {
    closePayment();
  }
});

/* ── Live validation on blur ── */
document.addEventListener('DOMContentLoaded', () => {
  const payName  = document.getElementById('payName');
  const payEmail = document.getElementById('payEmail');
  const customAmt = document.getElementById('customAmountInput');

  if (payName) {
    payName.addEventListener('blur', () => {
      if (payName.value.trim().length < 2) {
        setFieldError('payName', 'Please enter your full name.');
      } else {
        clearFieldError('payName');
      }
    });
    payName.addEventListener('input', () => clearFieldError('payName'));
  }

  if (payEmail) {
    payEmail.addEventListener('blur', () => {
      const v = payEmail.value.trim();
      if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        setFieldError('payEmail', 'Please enter a valid email address.');
      } else {
        clearFieldError('payEmail');
      }
    });
    payEmail.addEventListener('input', () => clearFieldError('payEmail'));
  }

  if (customAmt) {
    customAmt.addEventListener('input', () => {
      clearFieldError('customAmountInput');
      const v = parseFloat(customAmt.value);
      if (v && v >= 5) {
        document.getElementById('payAmount').textContent = formatZAR(v);
      }
    });
  }
});
