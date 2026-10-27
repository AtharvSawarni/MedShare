// js/dashboard.js
// Dashboard logic. Uses helpers from js/main.js.

let medicines = [];
let requests = [];

async function loadData() {
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
}

function renderDashboard() {
  renderStats();
  renderActivity();
  renderDistribution();
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

// Join requests to medicines, and add pending donations
function buildActivityRows() {
  const rows = [];

  medicines.filter(m => m.status === 'pending').forEach(m => {
    rows.push({
      kind: 'donation', id: m.id, name: m.name,
      who: m.donorName || 'Donor', role: 'Donor',
      qty: m.quantity, expiry: m.expiry, status: m.status
    });
  });

  const newestFirst = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  newestFirst.forEach(r => {
    const med = medicines.find(m => m.id === r.medicineId);
    rows.push({
      kind: 'request', id: r.id, name: med ? med.name : 'Unknown medicine',
      who: r.requesterName, role: 'Requester',
      qty: r.quantity, expiry: med ? med.expiry : null, status: r.status
    });
  });

  return rows.slice(0, 10);
}

function renderActivity() {
  const body = document.getElementById('activity-body');
  const rows = buildActivityRows();

  if (rows.length === 0) {
    body.innerHTML = '<tr><td colspan="6">No activity yet.</td></tr>';
    return;
  }

  body.innerHTML = rows.map(r => `
    <tr>
      <td>${escapeHTML(r.name)}</td>
      <td>${escapeHTML(r.who)}<span class="row-sub">${r.role}</span></td>
      <td>${escapeHTML(r.qty)}</td>
      <td>${r.expiry ? formatExpiry(r.expiry) : '—'}</td>
      <td><span class="status ${statusClass(r.status)}">${statusLabel(r.status)}</span></td>
            <td><span class="status ${statusClass(r.status)}">${statusLabel(r.status)}</span></td>
      <td>${actionButton(r)}</td>
    </tr>
    </tr>
  `).join('');
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

  document.getElementById('stat-available').textContent = available.length;
  document.getElementById('stat-near-expiry').textContent = nearExpiry.length;
  document.getElementById('stat-fulfilled').textContent = fulfilled.length;
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('activity-body').addEventListener('click', handleAction);
  loadData();
});