const express = require('express');
const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const Request = require('../models/Request');
const wrap = require('../utils/wrap');
const { STATUSES } = require('../utils/validators');
const { requireAuth, requireRole } = require('./auth');
const { parseQuantity, formatQuantity } = require('../utils/quantity');

const router = express.Router();
const isId = mongoose.isValidObjectId;

// READ: all requests
router.get('/requests', requireAuth, wrap(async (req, res) => {
  if (req.user.role === 'donor') return res.status(403).json({ error: 'Requester access required' });
  const filter = req.user.role === 'ngo' ? {} : { requesterId: req.user.id };
  res.json(await Request.find(filter).sort({ createdAt: -1 }));
}));

// CREATE: a new request for a medicine
router.post('/requests', requireRole('requester'), wrap(async (req, res) => {
  const { medicineId, requesterName, requesterType, contact, deliveryAddress, quantity, reason } = req.body;
  if (!medicineId || !requesterName || !contact || !deliveryAddress || !quantity) {
    return res.status(400).json({ error: 'Medicine, name, contact, delivery address and quantity are required' });
  }
  const requestedQuantity = parseQuantity(quantity);
  if (!requestedQuantity || requestedQuantity.amount <= 0) {
    return res.status(400).json({ error: 'Enter a numeric quantity such as 1 pack' });
  }
  if (!isId(medicineId) || !(await Medicine.exists({ _id: medicineId }))) {
    return res.status(404).json({ error: 'Medicine not found' });
  }
  const item = await Request.create({
    medicineId,
    requesterId: req.user.id,
    requesterName,
    requesterType,
    contact,
    deliveryAddress,
    quantity,
    reason
  });
  res.status(201).json(item);
}));

// UPDATE: change the status of a request
router.patch('/requests/:id', requireRole('ngo'), wrap(async (req, res) => {
  if (!STATUSES.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
  if (!isId(req.params.id)) return res.status(404).json({ error: 'Request not found' });

  const session = await mongoose.startSession();
  let result;
  let failure;
  try {
    await session.withTransaction(async () => {
      const item = await Request.findById(req.params.id).session(session);
      if (!item) {
        failure = { status: 404, error: 'Request not found' };
        return;
      }

      if (req.body.status === 'fulfilled') {
        if (item.status !== 'approved') {
          failure = { status: 409, error: 'Only approved requests can be fulfilled' };
          return;
        }

        const medicine = await Medicine.findOne({
          _id: item.medicineId,
          status: 'available',
        }).session(session);
        const available = parseQuantity(medicine?.quantity);
        const requested = parseQuantity(item.quantity);

        if (!medicine || !available || !requested || !available.amount || !requested.amount) {
          failure = { status: 409, error: 'Inventory quantity is not numeric enough to fulfil this request' };
          return;
        }
        if (available.unit && requested.unit && available.unit !== requested.unit) {
          failure = { status: 409, error: 'Request and inventory quantity units do not match' };
          return;
        }
        if (requested.amount > available.amount) {
          failure = { status: 409, error: 'Requested quantity exceeds available inventory' };
          return;
        }

        const remaining = available.amount - requested.amount;
        const updatedMedicine = await Medicine.findOneAndUpdate(
          { _id: medicine._id, status: 'available', quantity: medicine.quantity },
          {
            quantity: formatQuantity(remaining, available.unit || requested.unit),
            status: remaining === 0 ? 'fulfilled' : 'available',
          },
          { new: true, session }
        );
        if (!updatedMedicine) {
          failure = { status: 409, error: 'Inventory changed. Refresh and try again.' };
          return;
        }
      }

      item.status = req.body.status;
      await item.save({ session });
      result = item;
    });
  } finally {
    await session.endSession();
  }

  if (failure) return res.status(failure.status).json({ error: failure.error });
  res.json(result);
}));

// DELETE: remove a request
router.delete('/requests/:id', requireRole('ngo'), wrap(async (req, res) => {
  const item = isId(req.params.id) ? await Request.findByIdAndDelete(req.params.id) : null;
  item ? res.json({ message: 'Request deleted', id: String(item._id) }) : res.status(404).json({ error: 'Request not found' });
}));

module.exports = router;
