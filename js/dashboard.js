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
  console.log('medicines:', medicines);
  console.log('requests:', requests);
}

document.addEventListener('DOMContentLoaded', loadData);