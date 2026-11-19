const donateForm = document.getElementById('donate-form');

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
    'pickup-location': 'Enter the pickup location'
  };

  for (const [field, message] of Object.entries(required)) {
    const input = form.elements[field];
    if (!input.value.trim()) {
      showFieldError(input, message);
      ok = false;
    }
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
  'notes': 'notes'
};

function buildDonationBody(form) {
  const body = {};
  for (const [field, apiField] of Object.entries(FIELD_MAP)) {
    body[apiField] = form.elements[field].value.trim();
  }
  return body;
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
    donateForm.reset();
  } else if (res.data.errors) {
    clearFieldErrors(donateForm);
    for (const [field, apiField] of Object.entries(FIELD_MAP)) {
      if (res.data.errors[apiField]) {
        showFieldError(donateForm.elements[field], res.data.errors[apiField]);
      }
    }
  } else {
    showToast(res.data.error, 'error');
  }
});

const pincodeInput = document.getElementById('pincode');
const pincodeHint = document.getElementById('pincode-hint');

function setPincodeHint(text, type = '') {
  pincodeHint.textContent = text;
  pincodeHint.className = 'field-hint' + (type ? ` ${type}` : '');
}

pincodeInput.addEventListener('input', async () => {
  const pin = pincodeInput.value.trim();
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
  const locationInput = donateForm.elements['pickup-location'];
  if (!locationInput.value.trim()) locationInput.value = place;
});

donateForm.addEventListener('reset', () => setPincodeHint(''));