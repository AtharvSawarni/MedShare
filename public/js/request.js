const requestForm = document.getElementById('request-form');
const summary = document.getElementById('med-summary');
const medicineIdInput = document.getElementById('medicine-id');
const submitButton = requestForm.querySelector('button');
const medicineId = getParam('id');
const REQUEST_DRAFT_KEY = 'medshare:request-draft';
const AUTO_SUBMIT_KEY = 'medshare:request-auto-submit';

async function loadMedicine() {
  if (!medicineId) {
    submitButton.disabled = true;
    return;
  }

  const res = await API.get('/api/medicines/' + encodeURIComponent(medicineId));
  if (!res.ok) {
    summary.textContent = res.data.error || 'Medicine not found';
    submitButton.disabled = true;
    return;
  }

  const m = res.data;
    if (m.status !== 'available') {
    summary.textContent = 'This medicine is not available for request.';
    submitButton.disabled = true;
    return;
  }
  const info = getExpiryInfo(m.expiry);
  summary.innerHTML =
    '<strong>' + escapeHTML(m.name) + '</strong><br>' +
    escapeHTML(m.category) + ' · ' + escapeHTML(m.location) + '<br>' +
    'Expiry: ' + formatExpiry(m.expiry) +
    ' <span class="badge ' + info.status + '">' + escapeHTML(info.label) + '</span>';
  medicineIdInput.value = m.id;
}

function saveRequestDraft() {
  const fields = ['requesterName', 'requesterType', 'contact', 'deliveryAddress', 'quantity', 'reason'];
  const draft = { medicineId: medicineIdInput.value };
  fields.forEach((field) => { draft[field] = requestForm.elements[field].value; });
  sessionStorage.setItem(REQUEST_DRAFT_KEY, JSON.stringify(draft));
}

function clearRequestDraft() {
  sessionStorage.removeItem(REQUEST_DRAFT_KEY);
  sessionStorage.removeItem(AUTO_SUBMIT_KEY);
}

function restoreRequestDraft() {
  const rawDraft = sessionStorage.getItem(REQUEST_DRAFT_KEY);
  if (!rawDraft) return;

  const draft = JSON.parse(rawDraft);
  ['requesterName', 'requesterType', 'contact', 'deliveryAddress', 'quantity', 'reason'].forEach((field) => {
    if (draft[field] !== undefined) requestForm.elements[field].value = draft[field];
  });
  if (sessionStorage.getItem(AUTO_SUBMIT_KEY) === 'true') {
    sessionStorage.removeItem(AUTO_SUBMIT_KEY);
    setTimeout(() => requestForm.requestSubmit(), 0);
  }
}

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

function validateRequest(form) {
  clearFieldErrors(form);
  let ok = true;

  const name = form.elements.namedItem('requesterName');
  if (!name.value.trim()) {
    showFieldError(name, 'Enter your name or organisation');
    ok = false;
  }

  const contact = form.elements.namedItem('contact');
  const c = contact.value.trim();
  const isEmail = /^\S+@\S+\.\S+$/.test(c);
  const isPhone = /^\d{10}$/.test(c.replace(/[\s-]/g, ''));
  if (!isEmail && !isPhone) {
    showFieldError(contact, 'Enter a valid email or 10-digit phone number');
    ok = false;
  }

  const quantity = form.elements.namedItem('quantity');
  if (!quantity.value.trim()) {
    showFieldError(quantity, 'Enter the quantity needed');
    ok = false;
  }

  const deliveryAddress = form.elements.namedItem('deliveryAddress');
  if (!deliveryAddress.value.trim()) {
    showFieldError(deliveryAddress, 'Enter the delivery address');
    ok = false;
  }
  return ok;
}

requestForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateRequest(requestForm)) return;

  const f = requestForm.elements;
  const body = {
    medicineId: medicineIdInput.value,
    requesterName: f.namedItem('requesterName').value.trim(),
    requesterType: f.namedItem('requesterType').value,
    contact: f.namedItem('contact').value.trim(),
    deliveryAddress: f.namedItem('deliveryAddress').value.trim(),
    quantity: f.namedItem('quantity').value.trim(),
    reason: f.namedItem('reason').value.trim()
  };

  submitButton.disabled = true;
  const res = await API.post('/api/requests', body);

  if (res.ok) {
    showToast('Request sent! The NGO will review it.');
    clearRequestDraft();
    requestForm.reset();
    setTimeout(() => { window.location.href = 'browse.html'; }, 1500);
  } else if (res.status === 401) {
    saveRequestDraft();
    sessionStorage.setItem(AUTO_SUBMIT_KEY, 'true');
    window.location.href = `/signin.html?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
  } else if (res.status === 403) {
    submitButton.disabled = false;
    showToast(res.data.error || 'Only requester accounts can submit medicine requests.', 'error');
  } else {
    submitButton.disabled = false;
    showToast(res.data.error, 'error');
  }
});

loadMedicine().then(restoreRequestDraft);