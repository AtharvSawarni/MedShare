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

// ---------- medicines ----------
app.get('/api/medicines', wrap(async (req, res) => res.json(await read('medicines'))));

app.get('/api/medicines/:id', wrap(async (req, res) => {
  const item = (await read('medicines')).find((m) => m.id === req.params.id);
  item ? res.json(item) : res.status(404).json({ error: 'Medicine not found' });
}));

// ---------- more routes go here (added in the next commits) ----------

app.listen(PORT, () => console.log(`MedShare running at http://localhost:${PORT}`));