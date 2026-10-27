// js/dashboard.js
// Dashboard page logic. Uses helpers from js/main.js (API, showToast, etc.)

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
  // Temporary: just prove the data arrived. Later commits fill this in.
  console.log('medicines:', medicines);
  console.log('requests:', requests);
}

document.addEventListener('DOMContentLoaded', loadData);
console.log('dashboard.js loaded');
