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