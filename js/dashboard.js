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
}

function renderStats() {
  const available = medicines.filter(m => m.status === 'available');
  const nearExpiry = available.filter(m => getExpiryInfo(m.expiry).daysLeft < 180);
  const fulfilled = requests.filter(r => r.status === 'fulfilled');

  document.getElementById('stat-available').textContent = available.length;
  document.getElementById('stat-near-expiry').textContent = nearExpiry.length;
  document.getElementById('stat-fulfilled').textContent = fulfilled.length;
}
document.addEventListener('DOMContentLoaded', loadData);