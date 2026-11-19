// Medicine details page: loads one medicine using ?id= from the URL
async function loadMedicine() {
  const title = document.getElementById('d-name');
  const subtitle = document.getElementById('d-category');
  const id = getParam('id');

  if (!id) {
    title.textContent = 'No medicine selected';
    subtitle.textContent = 'Go back to Browse and pick a medicine.';
    return;
  }

  const res = await API.get('/api/medicines/' + encodeURIComponent(id));
  if (!res.ok) {
    title.textContent = 'Medicine not found';
    subtitle.textContent = res.data.error || 'Could not load this medicine.';
    return;
  }

  const m = res.data;
  const info = getExpiryInfo(m.expiry);
  document.title = m.name + ' — MedShare';
  title.textContent = m.name;
  subtitle.textContent = m.category;

  const badge = document.getElementById('d-badge');
  badge.className = 'badge ' + info.status;
  badge.textContent = info.label;

  document.getElementById('d-qty').textContent = m.quantity;
  document.getElementById('d-expiry').textContent = formatExpiry(m.expiry) + ' (' + info.daysLeft + ' days left)';
  document.getElementById('d-batch').textContent = m.batch || 'Not provided';
  document.getElementById('d-location').textContent = m.location;
  document.getElementById('d-donor').textContent = m.donorName;
  document.getElementById('d-status').textContent = m.status;

  const requestBtn = document.getElementById('request-btn');
  requestBtn.href = 'request.html?id=' + encodeURIComponent(m.id);
  if (m.status !== 'available') requestBtn.style.display = 'none'; // only available medicines can be requested
}

loadMedicine();