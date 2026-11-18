const mongoose = require('mongoose');
const toJSON = require('./toJSON');
const { STATUSES } = require('../utils/validators');

const requestSchema = new mongoose.Schema(
  {
    medicineId: { type: String, required: true }, // the id of the requested medicine
    requesterName: { type: String, required: true, trim: true },
    requesterType: { type: String, default: 'NGO' },
    contact: { type: String, required: true, trim: true },
    quantity: { type: String, required: true, trim: true },
    reason: { type: String, default: '' },
    status: { type: String, enum: STATUSES, default: 'pending' },
  },
  { timestamps: true, toJSON }
);

module.exports = mongoose.model('Request', requestSchema);
