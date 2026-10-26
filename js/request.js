const requestForm = document.getElementById('request-form');
const summary = document.getElementById('med-summary');
const medicineIdInput = document.getElementById('medicine-id');
const submitButton = requestForm.querySelector('button');
const medicineId = getParam('id');

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
  const info = getExpiryInfo(m.expiry);
  summary.innerHTML =
    '<strong>' + escapeHTML(m.name) + '</strong><br>' +
    escapeHTML(m.category) + ' · ' + escapeHTML(m.location) + '<br>' +
    'Expiry: ' + formatExpiry(m.expiry) +
    ' <span class="badge ' + info.status + '">' + escapeHTML(info.label) + '</span>';
  medicineIdInput.value = m.id;
}

loadMedicine();