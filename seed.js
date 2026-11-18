require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Medicine = require('./models/Medicine');
const Request = require('./models/Request');

const readJSON = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, 'data', name + '.json'), 'utf8'));

// Copies the Phase 2 JSON data into MongoDB. Use "npm run seed -- --reset" to start over.
async function seed() {
  await connectDB();
  if (process.argv.includes('--reset')) {
    await Medicine.deleteMany({});
    await Request.deleteMany({});
    console.log('Old medicines and requests removed');
  }
  if ((await Medicine.countDocuments()) > 0) {
    console.log('Medicines already exist. Nothing seeded (use --reset to start over).');
    return;
  }
  const idMap = {}; // old ids ("m1") -> new MongoDB ids
  for (const { id, ...fields } of readJSON('medicines')) {
    const doc = await Medicine.create(fields);
    idMap[id] = String(doc._id);
  }
  let requests = 0;
  for (const { id, medicineId, ...fields } of readJSON('requests')) {
    await Request.create({ ...fields, medicineId: idMap[medicineId] || medicineId });
    requests++;
  }
  console.log(`Seeded ${Object.keys(idMap).length} medicines and ${requests} requests`);
}

seed().catch((e) => console.error('Seed failed:', e.message)).finally(() => mongoose.disconnect());
