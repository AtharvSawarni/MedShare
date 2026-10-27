// Browse page: loads medicines from the API and shows them as cards (nearest expiry first)
const grid = document.getElementById('medicine-grid');
let allMedicines = [];

function cardHTML(m) {
  const info = getExpiryInfo(m.expiry);
  return `
    <article class="med-card">
      <div class="med-top">
        <span class="med-category">${escapeHTML(m.category)}</span>
        <span class="badge ${info.status}">${info.label}</span>
      </div>
      <h3><a href="medicine.html?id=${encodeURIComponent(m.id)}">${escapeHTML(m.name)}</a></h3>
      <p class="med-meta">Qty: <strong>${escapeHTML(m.quantity)}</strong> &nbsp;·&nbsp; Expires: <strong>${formatExpiry(m.expiry)}</strong></p>
      <div class="med-footer">
        <span class="donor"><span aria-hidden="true">👤</span> ${escapeHTML(m.donorName)}</span>
        <a href="request.html?id=${encodeURIComponent(m.id)}" class="btn btn-primary btn-small">Request</a>
      </div>
    </article>`;
}

function renderMedicines(list) {
  if (list.length === 0) {
    grid.innerHTML = '<p class="g-text">No medicines match your search.</p>';
    return;
  }
  // FEFO: First-Expiry-First-Out, the medicine closest to expiry is shown first
  grid.innerHTML = fefoSort(list).map(cardHTML).join('');
}

async function loadMedicines() {
  const res = await API.get('/api/medicines');
  if (!res.ok) {
    grid.innerHTML = `<p class="g-text">${escapeHTML(res.data.error || 'Could not load medicines.')}</p>`;
    return;
  }
  // Only verified (available) medicines that have not expired
  allMedicines = res.data.filter((m) => m.status === 'available' && getExpiryInfo(m.expiry).daysLeft >= 0);
  renderMedicines(allMedicines);
}

loadMedicines();