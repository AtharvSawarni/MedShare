const mongoose = require('mongoose');
const toJSON = require('./toJSON');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ['donor', 'ngo'], default: 'donor' },
    salt: { type: String, required: true },
    hash: { type: String, required: true },
  },
  { timestamps: true, toJSON }
);

module.exports = mongoose.model('User', userSchema);
