// js/dashboard.js
// Dashboard logic. Uses helpers from js/main.js.

let medicines = [];
let requests = [];
let loading = false;

async function loadData() {
  if (loading) return;
  loading = true;
  try {
    const [medRes, reqRes] = await Promise.all([
      API.get('/api/medicines'),
      API.get('/api/requests')
    ]);

    if (!medRes.ok || !reqRes.ok) {
      const msg = (!medRes.ok ? medRes.data.error : reqRes.data.error) || 'Could not load dashboard data.';
      showToast(msg, 'error');
      return;
    }

    medicines = medRes.data;
    requests = reqRes.data;
    renderDashboard();
    const updated = document.getElementById('dashboard-updated');
    if (updated) updated.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } finally {
    loading = false;
  }
}

function renderDashboard() {
  renderStats();
  renderApprovals();
  renderDistribution();
  renderInventory();
}
const BAR_COLORS = ['teal', 'blue', 'green', 'amber'];

function renderDistribution() {
  const list = document.getElementById('dist-list');
  const available = medicines.filter(m => m.status === 'available');

  if (available.length === 0) {
    list.innerHTML = '<p class="g-text">No available medicines yet.</p>';
    return;
  }

  const counts = {};
  available.forEach(m => {
    const cat = m.category || 'Other';
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  list.innerHTML = entries.map(([cat, n], i) => {
    const pct = Math.round((n / available.length) * 100);
    return `
      <div class="dist-row">
        <div class="dist-label"><span>${escapeHTML(cat)}</span><span>${pct}%</span></div>
        <div class="dist-bar"><div class="dist-fill ${BAR_COLORS[i % BAR_COLORS.length]}" style="width:${pct}%"></div></div>
      </div>`;
  }).join('');
}
function statusLabel(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// "available" has no badge style of its own, so reuse the green "approved" one
function statusClass(s) {
  return s === 'available' ? 'approved' : s;
}

function renderApprovals() {
  const donationBody = document.getElementById('donation-approval-body');
  const requestBody = document.getElementById('request-approval-body');
  const pendingDonations = medicines.filter(m => m.status === 'pending');
  const activeRequests = requests
    .filter(r => ['pending', 'approved'].includes(r.status))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  donationBody.innerHTML = pendingDonations.length
    ? pendingDonations.map(m => `
      <tr>
        <td>${escapeHTML(m.name)}<span class="row-sub">${escapeHTML(m.category)}</span></td>
        <td>${escapeHTML(m.donorName || 'Donor')}</td>
        <td>${escapeHTML(m.quantity)}</td>
        <td>${formatExpiry(m.expiry)}</td>
        <td>${actionButton({ kind: 'donation', id: m.id, status: m.status })}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="5">No donations awaiting approval.</td></tr>';

  requestBody.innerHTML = activeRequests.length
    ? activeRequests.map(r => {
      const med = medicines.find(m => m.id === r.medicineId);
      return `
        <tr>
          <td>${escapeHTML(med ? med.name : 'Unknown medicine')}</td>
          <td>${escapeHTML(r.requesterName)}<span class="row-sub">Contact: ${escapeHTML(r.contact)}</span></td>
          <td>${escapeHTML(r.quantity)}</td>
          <td>${escapeHTML(r.deliveryAddress)}</td>
          <td><span class="status ${statusClass(r.status)}">${statusLabel(r.status)}</span></td>
          <td>${actionButton({ kind: 'request', id: r.id, status: r.status })}</td>
        </tr>`;
    }).join('')
    : '<tr><td colspan="6">No requests awaiting approval or fulfilment.</td></tr>';
}
function makeButton(label, kind, id, next) {
  return `<button class="btn btn-primary btn-small" data-kind="${kind}" data-id="${escapeHTML(id)}" data-next="${next}">${label}</button>`;
}

function actionButton(r) {
  if (r.kind === 'request' && r.status === 'pending')  return makeButton('Approve', 'request', r.id, 'approved');
  if (r.kind === 'request' && r.status === 'approved') return makeButton('Fulfil', 'request', r.id, 'fulfilled');
  if (r.kind === 'donation' && r.status === 'pending') return makeButton('Approve', 'donation', r.id, 'available');
  return '—';
}

const SUCCESS_MESSAGES = {
  'donation:available': 'Donation approved and listed.',
  'request:approved': 'Request approved.',
  'request:fulfilled': 'Request marked as fulfilled.'
};

async function handleAction(e) {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;

  const { kind, id, next } = btn.dataset;
  const url = (kind === 'donation' ? '/api/medicines/' : '/api/requests/') + id;

  btn.disabled = true;
  const res = await API.patch(url, { status: next });

  if (!res.ok) {
    showToast(res.data.error || 'Update failed.', 'error');
    btn.disabled = false;
    return;
  }

  showToast(SUCCESS_MESSAGES[kind + ':' + next]);
  await loadData();
}

function renderStats() {
  const available = medicines.filter(m => m.status === 'available');
  const nearExpiry = available.filter(m => getExpiryInfo(m.expiry).daysLeft < 180);
  const fulfilled = requests.filter(r => r.status === 'fulfilled');

  document.getElementById('stat-available').textContent = medicines.length;
  document.getElementById('stat-near-expiry').textContent = nearExpiry.length;
  document.getElementById('stat-fulfilled').textContent = fulfilled.length;
}
// ---------- Manage inventory: edit and delete medicines ----------
function renderInventory() {
  const body = document.getElementById('inventory-body');

  if (medicines.length === 0) {
    body.innerHTML = '<tr><td colspan="6">No medicines in the inventory yet.</td></tr>';
    return;
  }

  // FEFO: nearest expiry first, so the medicines that need action are at the top
  body.innerHTML = fefoSort(medicines).map(m => `
    <tr>
      <td>${escapeHTML(m.name)}<span class="row-sub">${escapeHTML(m.category)}</span></td>
      <td>${escapeHTML(m.quantity)}</td>
      <td>${formatExpiry(m.expiry)}</td>
      <td>${escapeHTML(m.location)}${m.address ? `<span class="row-sub">${escapeHTML(m.address)}</span>` : ''}</td>
      <td><span class="status ${statusClass(m.status)}">${statusLabel(m.status)}</span></td>
      <td class="row-actions">
        <button class="btn btn-outline btn-small" data-action="edit" data-id="${escapeHTML(m.id)}">Edit</button>
        <button class="btn btn-danger btn-small" data-action="delete" data-id="${escapeHTML(m.id)}">Delete</button>
      </td>
    </tr>
  `).join('');
}

function handleInventoryClick(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  if (btn.dataset.action === 'edit') openEditDialog(btn.dataset.id);
  if (btn.dataset.action === 'delete') deleteMedicine(btn.dataset.id);
}

async function deleteMedicine(id) {
  const med = medicines.find(m => m.id === id);
  if (!med) return;
  if (!confirm('Delete "' + med.name + '"? Requests made for it will be deleted too.')) return;

  const res = await API.request('DELETE', '/api/medicines/' + id);
  if (!res.ok) {
    showToast(res.data.error || 'Delete failed.', 'error');
    return;
  }
  showToast('Medicine deleted.');
  await loadData();
}

// ---------- Edit dialog ----------
const editDialog = document.getElementById('edit-dialog');
const editForm = document.getElementById('edit-form');
const EDIT_FIELDS = ['name', 'category', 'batch', 'expiry', 'quantity', 'location', 'address', 'notes'];

function clearEditErrors() {
  editForm.querySelectorAll('.field-error').forEach(el => el.remove());
  editForm.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
}

function showEditError(fieldName, message) {
  const input = editForm.elements.namedItem(fieldName);
  if (!input) return;
  input.classList.add('invalid');
  const span = document.createElement('span');
  span.className = 'field-error';
  span.textContent = message;
  input.insertAdjacentElement('afterend', span);
}

function openEditDialog(id) {
  const med = medicines.find(m => m.id === id);
  if (!med) return;
  clearEditErrors();
  editForm.dataset.id = id;
  EDIT_FIELDS.forEach(f => { editForm.elements.namedItem(f).value = med[f] || ''; });
  editDialog.showModal();
}

async function saveEdit(e) {
  e.preventDefault();
  clearEditErrors();

  const body = {};
  EDIT_FIELDS.forEach(f => { body[f] = editForm.elements.namedItem(f).value.trim(); });

  let ok = true;
  ['name', 'category', 'expiry', 'quantity', 'location'].forEach(f => {
    if (!body[f]) { showEditError(f, 'This field is required'); ok = false; }
  });
  if (!ok) return;

  const saveBtn = editForm.querySelector('button[type="submit"]');
  saveBtn.disabled = true;
  const res = await API.patch('/api/medicines/' + editForm.dataset.id, body);
  saveBtn.disabled = false;

  if (!res.ok) {
    if (res.data.errors) {
      Object.entries(res.data.errors).forEach(([field, msg]) => showEditError(field, msg));
    } else {
      showToast(res.data.error || 'Update failed.', 'error');
    }
    return;
  }

  editDialog.close();
  showToast('Medicine updated.');
  await loadData();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('donation-approval-body').addEventListener('click', handleAction);
  document.getElementById('request-approval-body').addEventListener('click', handleAction);
  document.getElementById('inventory-body').addEventListener('click', handleInventoryClick);
  editForm.addEventListener('submit', saveEdit);
  document.getElementById('edit-cancel').addEventListener('click', () => editDialog.close());
  loadData();
  setInterval(() => {
    if (!document.hidden) loadData();
  }, 10000);
});