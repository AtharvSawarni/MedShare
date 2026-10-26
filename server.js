const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, 'data');

app.use(express.json());
// Never expose server code or raw data files to the browser
app.use(['/data', '/server.js', '/package.json', '/node_modules'], (req, res) => res.status(403).end());
app.use(express.static(__dirname));
// ---------- helpers ----------
const read = async (name) => JSON.parse(await fs.readFile(path.join(DATA, name + '.json'), 'utf8'));
const write = (name, data) => fs.writeFile(path.join(DATA, name + '.json'), JSON.stringify(data, null, 2));
const newId = (prefix) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => res.status(500).json({ error: e.message }));

// ---------- validation ----------
// Accepts "YYYY-MM-DD" (date input) or "YYYY-MM" (treated as last day of that month)
function parseExpiry(value) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value || '');
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), m[3] ? Number(m[3]) : 0];
  const date = d ? new Date(y, mo - 1, d) : new Date(y, mo, 0);
  return isNaN(date) ? null : date;
}

function validateDonation(b) {
  const errors = {};
  ['name', 'category', 'expiry', 'quantity', 'location'].forEach((k) => {
    if (!b[k] || !String(b[k]).trim()) errors[k] = 'This field is required';
  });
  if (b.expiry) {
    const date = parseExpiry(b.expiry);
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() + 1);
    if (!date || date < minDate) errors.expiry = 'Expiry must be at least 1 month from today';
  }
  return errors;
}

// ---------- medicines ----------
app.get('/api/medicines', wrap(async (req, res) => res.json(await read('medicines'))));

app.get('/api/medicines/:id', wrap(async (req, res) => {
  const item = (await read('medicines')).find((m) => m.id === req.params.id);
  item ? res.json(item) : res.status(404).json({ error: 'Medicine not found' });
}));

// ---------- more routes go here (added in the next commits) ----------

app.listen(PORT, () => console.log(`MedShare running at http://localhost:${PORT}`));