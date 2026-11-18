const express = require('express');
const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const Request = require('../models/Request');
const wrap = require('../utils/wrap');
const { STATUSES } = require('../utils/validators');

const router = express.Router();
const isId = mongoose.isValidObjectId;

// READ: all requests
router.get('/requests', wrap(async (req, res) => res.json(await Request.find().sort({ createdAt: 1 }))));

// CREATE: a new request for a medicine
router.post('/requests', wrap(async (req, res) => {
  const { medicineId, requesterName, requesterType, contact, quantity, reason } = req.body;
  if (!medicineId || !requesterName || !contact || !quantity) {
    return res.status(400).json({ error: 'Medicine, name, contact and quantity are required' });
  }
  if (!isId(medicineId) || !(await Medicine.exists({ _id: medicineId }))) {
    return res.status(404).json({ error: 'Medicine not found' });
  }
  const item = await Request.create({ medicineId, requesterName, requesterType, contact, quantity, reason });
  res.status(201).json(item);
}));

// UPDATE: change the status of a request
router.patch('/requests/:id', wrap(async (req, res) => {
  if (!STATUSES.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
  const item = isId(req.params.id)
    ? await Request.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
    : null;
  item ? res.json(item) : res.status(404).json({ error: 'Request not found' });
}));

// DELETE: remove a request
router.delete('/requests/:id', wrap(async (req, res) => {
  const item = isId(req.params.id) ? await Request.findByIdAndDelete(req.params.id) : null;
  item ? res.json({ message: 'Request deleted', id: String(item._id) }) : res.status(404).json({ error: 'Request not found' });
}));

module.exports = router;
