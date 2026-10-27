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
  applyFilters();
}

// ---------- Search and filters ----------
const searchInput = document.getElementById('search-input');
const locationSelect = document.getElementById('location-select');
const pills = document.querySelectorAll('.pill');
const filters = { search: '', location: 'All Locations', category: 'All' };

function applyFilters() {
  const text = filters.search.trim().toLowerCase();
  const result = allMedicines.filter((m) => {
    const matchesText = !text || m.name.toLowerCase().includes(text) || m.category.toLowerCase().includes(text);
    const matchesLocation = filters.location === 'All Locations' || m.location === filters.location;
    const matchesCategory = filters.category === 'All' || m.category === filters.category;
    return matchesText && matchesLocation && matchesCategory;
  });
  renderMedicines(result);
}

searchInput.addEventListener('input', () => { filters.search = searchInput.value; applyFilters(); });
locationSelect.addEventListener('change', () => { filters.location = locationSelect.value; applyFilters(); });
pills.forEach((pill) => pill.addEventListener('click', () => {
  pills.forEach((p) => p.classList.remove('active'));
  pill.classList.add('active');
  filters.category = pill.dataset.category;
  applyFilters();
}));

loadMedicines();