const donateForm = document.getElementById('donate-form');
const pincodeInput = document.getElementById('pincode');
const DONATION_DRAFT_KEY = 'medshare:donation-draft';
const AUTO_SUBMIT_KEY = 'medshare:donation-auto-submit';
let pincodeValid = false;

function clearFieldErrors(form) {
  form.querySelectorAll('.field-error').forEach(el => el.remove());
  form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
}

function showFieldError(input, message) {
  input.classList.add('invalid');
  const span = document.createElement('span');
  span.className = 'field-error';
  span.textContent = message;
  input.insertAdjacentElement('afterend', span);
}

function validateDonation(form) {
  clearFieldErrors(form);
  let ok = true;

  const required = {
    'medicine-name': 'Enter the medicine name',
    'category': 'Choose a category',
    'expiry-date': 'Choose the expiry date',
    'quantity': 'Enter the quantity',
    'pincode': 'Enter the pincode',
    'pickup-location': 'Enter the pickup city or area',
    'pickup-address': 'Enter the full pickup address'
  };

  for (const [field, message] of Object.entries(required)) {
    const input = form.elements[field];
    if (!input.value.trim()) {
      showFieldError(input, message);
      ok = false;
    }
  }

  const pincode = pincodeInput.value.trim();
  if (pincode && !/^\d{6}$/.test(pincode)) {
    showFieldError(pincodeInput, 'Enter a valid 6-digit pincode');
    ok = false;
  } else if (pincode && !pincodeValid) {
    showFieldError(pincodeInput, 'Verify this pincode before submitting');
    ok = false;
  }

  const expiry = form.elements['expiry-date'];
  if (expiry.value) {
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() + 1);
    if (new Date(expiry.value) < minDate) {
      showFieldError(expiry, 'Expiry must be at least 1 month from today');
      ok = false;
    }
  }
  return ok;
}
const FIELD_MAP = {
  'medicine-name': 'name',
  'category': 'category',
  'batch-number': 'batch',
  'expiry-date': 'expiry',
  'quantity': 'quantity',
  'pickup-location': 'location',
  'pickup-address': 'address',
  'notes': 'notes'
};

function buildDonationBody(form) {
  const body = {};
  for (const [field, apiField] of Object.entries(FIELD_MAP)) {
    body[apiField] = form.elements[field].value.trim();
  }
  return body;
}

function saveDonationDraft() {
  const draft = { pincode: pincodeInput.value.trim() };
  Object.keys(FIELD_MAP).forEach((field) => {
    draft[field] = donateForm.elements[field].value;
  });
  sessionStorage.setItem(DONATION_DRAFT_KEY, JSON.stringify(draft));
}

function clearDonationDraft() {
  sessionStorage.removeItem(DONATION_DRAFT_KEY);
  sessionStorage.removeItem(AUTO_SUBMIT_KEY);
}

function restoreDonationDraft() {
  const rawDraft = sessionStorage.getItem(DONATION_DRAFT_KEY);
  if (!rawDraft) return;

  const draft = JSON.parse(rawDraft);
  Object.keys(FIELD_MAP).forEach((field) => {
    if (draft[field] !== undefined) donateForm.elements[field].value = draft[field];
  });
  if (draft.pincode) {
    pincodeInput.value = draft.pincode;
    pincodeInput.dispatchEvent(new Event('input'));
  }
}

donateForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateDonation(donateForm)) return;

  const button = donateForm.querySelector('button');
  button.disabled = true;
  const res = await API.post('/api/donations', buildDonationBody(donateForm));
  button.disabled = false;

  if (res.ok) {
    showToast('Donation submitted! It will show after approval.');
    clearDonationDraft();
    donateForm.reset();
  } else if (res.data.errors) {
    clearFieldErrors(donateForm);
    for (const [field, apiField] of Object.entries(FIELD_MAP)) {
      if (res.data.errors[apiField]) {
        showFieldError(donateForm.elements[field], res.data.errors[apiField]);
      }
    }
  } else if (res.status === 401) {
    saveDonationDraft();
    sessionStorage.setItem(AUTO_SUBMIT_KEY, 'true');
    window.location.href = `/signin.html?returnTo=${encodeURIComponent('/donate.html')}`;
  } else if (res.status === 403) {
    showToast(res.data.error || 'Only donor accounts can submit medicine donations.', 'error');
  } else {
    showToast(res.data.error, 'error');
  }
});

const pincodeHint = document.getElementById('pincode-hint');

function setPincodeHint(text, type = '') {
  pincodeHint.textContent = text;
  pincodeHint.className = 'field-hint' + (type ? ` ${type}` : '');
}

pincodeInput.addEventListener('input', async () => {
  const pin = pincodeInput.value.trim();
  pincodeValid = false;
  if (pin.length < 6) {
    setPincodeHint('');
    return;
  }
  if (!/^\d{6}$/.test(pin)) {
    setPincodeHint('Pincode must be 6 digits', 'bad');
    return;
  }

  setPincodeHint('Looking up...');
  const response = await API.get(`/api/pincode/${pin}`);
  if (pincodeInput.value.trim() !== pin) return;

  if (!response.ok) {
    setPincodeHint(response.data.error, 'bad');
    return;
  }

  const place = `${response.data.city}, ${response.data.state}`;
  setPincodeHint(`Found: ${place}`, 'ok');
  pincodeValid = true;
  const locationInput = donateForm.elements['pickup-location'];
  locationInput.value = place;
  if (sessionStorage.getItem(AUTO_SUBMIT_KEY) === 'true') {
    sessionStorage.removeItem(AUTO_SUBMIT_KEY);
    setTimeout(() => donateForm.requestSubmit(), 0);
  }
});

donateForm.addEventListener('reset', () => {
  pincodeValid = false;
  setPincodeHint('');
});

restoreDonationDraft();