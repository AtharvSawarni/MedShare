const express = require('express');
const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const Request = require('../models/Request');
const wrap = require('../utils/wrap');
const { STATUSES, validateMedicine } = require('../utils/validators');

const router = express.Router();
const EDITABLE = ['name', 'category', 'batch', 'expiry', 'quantity', 'location', 'notes', 'status'];
const findMedicine = (id) => (mongoose.isValidObjectId(id) ? Medicine.findById(id) : null);

// READ: all medicines (optional filter: /api/medicines?status=available)
router.get('/medicines', wrap(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  res.json(await Medicine.find(filter).sort({ createdAt: 1 }));
}));

// READ: one medicine
router.get('/medicines/:id', wrap(async (req, res) => {
  const item = await findMedicine(req.params.id);
  item ? res.json(item) : res.status(404).json({ error: 'Medicine not found' });
}));

// FEFO match: available, unexpired medicines with the nearest expiry first
router.get('/match', wrap(async (req, res) => {
  const name = String(req.query.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Add ?name=... to search' });
  const today = new Date().toLocaleDateString('en-CA');                    // YYYY-MM-DD
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');             // treat the search text as plain text
  const filter = { status: 'available', expiry: { $gte: today }, name: new RegExp(escaped, 'i') };
  if (req.query.location) filter.location = req.query.location;
  const matches = await Medicine.find(filter).sort({ expiry: 1 });         // FEFO: earliest expiry first
  res.json({ query: name, count: matches.length, best: matches[0] || null, matches });
}));

// CREATE: a new donation. It waits for NGO approval, so status starts as "pending".
router.post('/donations', wrap(async (req, res) => {
  const errors = validateMedicine(req.body, true);
  if (Object.keys(errors).length) return res.status(400).json({ errors });
  const { name, category, batch, expiry, quantity, location, notes } = req.body;
  const item = await Medicine.create({ name, category, batch, expiry, quantity, location, notes });
  res.status(201).json(item);
}));

// UPDATE: change status (Approve / Fulfil) and/or edit details
router.patch('/medicines/:id', wrap(async (req, res) => {
  const item = await findMedicine(req.params.id);
  if (!item) return res.status(404).json({ error: 'Medicine not found' });
  if (req.body.status !== undefined && !STATUSES.includes(req.body.status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const errors = validateMedicine({ ...item.toObject(), ...req.body }, false);
  if (Object.keys(errors).length) return res.status(400).json({ errors });
  EDITABLE.forEach((field) => { if (req.body[field] !== undefined) item[field] = req.body[field]; });
  await item.save();
  res.json(item);
}));

// DELETE: remove a medicine together with the requests made for it
router.delete('/medicines/:id', wrap(async (req, res) => {
  const item = await findMedicine(req.params.id);
  if (!item) return res.status(404).json({ error: 'Medicine not found' });
  await item.deleteOne();
  await Request.deleteMany({ medicineId: String(item._id) });
  res.json({ message: 'Medicine deleted', id: String(item._id) });
}));

module.exports = router;
