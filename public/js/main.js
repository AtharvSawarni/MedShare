// Shared helpers for all MedShare pages. Load with: <script src="js/main.js"></script>

// ---------- API wrapper: every call returns { ok, status, data } ----------
const API = {
  async request(method, url, body) {
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      return { ok: false, status: 0, data: { error: 'Server not reachable. Is "npm start" running?' } };
    }
  },
  get: (url) => API.request('GET', url),
  post: (url, body) => API.request('POST', url, body),
  patch: (url, body) => API.request('PATCH', url, body),
};

async function updateNavigation() {
  const authLink = document.getElementById('auth-link');
  const donateLink = document.getElementById('donate-link');
  const browseLink = document.getElementById('browse-link');
  const dashboardLink = document.getElementById('dashboard-link');
  const requestsLink = document.getElementById('requests-link');
  const donationsLink = document.getElementById('donations-link');
  if (!authLink || !donateLink || !browseLink || !dashboardLink || !requestsLink || !donationsLink) return;

  const res = await API.get('/api/me');
  if (!res.ok) {
    donateLink.hidden = false;
    browseLink.hidden = false;
    dashboardLink.hidden = true;
    requestsLink.hidden = true;
    donationsLink.hidden = true;
    authLink.innerHTML = '<i data-lucide="log-in" aria-hidden="true"></i> Sign In';
    authLink.href = 'signin.html';
    if (window.lucide) lucide.createIcons();
    return;
  }

  donateLink.hidden = res.data.role !== 'donor';
  browseLink.hidden = ['donor', 'ngo'].includes(res.data.role);
  dashboardLink.hidden = res.data.role !== 'ngo';
  requestsLink.hidden = res.data.role !== 'requester';
  donationsLink.hidden = res.data.role !== 'donor';
  if (res.data.role === 'donor') {
    donationsLink.href = 'donations.html';
    donationsLink.textContent = 'My Donations';
  }
  authLink.innerHTML = '<i data-lucide="log-out" aria-hidden="true"></i> Sign Out';
  authLink.href = '#';
  authLink.addEventListener('click', async (event) => {
    event.preventDefault();
    await API.post('/api/logout');
    window.location.href = '/index.html';
  });
  if (window.lucide) lucide.createIcons();
}

updateNavigation();

// ---------- Expiry logic ----------
// Accepts "YYYY-MM-DD" (date input) or "YYYY-MM" (treated as last day of that month)
function parseExpiry(value) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value || '');
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), m[3] ? Number(m[3]) : 0];
  return d ? new Date(y, mo - 1, d) : new Date(y, mo, 0);
}

function getExpiryInfo(expiry) {
  const daysLeft = Math.ceil((parseExpiry(expiry) - new Date()) / 86400000);
  // "status" matches the CSS badge classes: safe / warn / urgent
  if (daysLeft < 0) return { daysLeft, status: 'urgent', label: 'Expired' };
  if (daysLeft < 60) return { daysLeft, status: 'urgent', label: 'Urgent: use first' };
  if (daysLeft < 180) return { daysLeft, status: 'warn', label: 'Expiring Soon' };
  return { daysLeft, status: 'safe', label: 'Safe Expiry' };
}

// Shown as MM/YYYY, e.g. "04/2027"
const formatExpiry = (expiry) => {
  const d = parseExpiry(expiry);
  return String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
};

// FEFO: First-Expiry-First-Out (nearest expiry first)
const fefoSort = (list) => [...list].sort((a, b) => parseExpiry(a.expiry) - parseExpiry(b.expiry));

// ---------- Small utilities ----------
const getParam = (name) => new URLSearchParams(window.location.search).get(name);

// Always escape JSON data before putting it into innerHTML
const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}