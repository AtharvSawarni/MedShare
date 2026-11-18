const mongoose = require('mongoose');
const toJSON = require('./toJSON');
const { STATUSES, normalizeExpiry } = require('../utils/validators');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    batch: { type: String, default: '', trim: true },
    expiry: { type: String, required: true, set: normalizeExpiry }, // stored as YYYY-MM-DD
    quantity: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    donorName: { type: String, default: 'Individual Donor' },
    status: { type: String, enum: STATUSES, default: 'pending' },
  },
  { timestamps: true, toJSON }
);

module.exports = mongoose.model('Medicine', medicineSchema);
