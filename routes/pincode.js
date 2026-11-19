const express = require('express');
const wrap = require('../utils/wrap');

const router = express.Router();
const API_URL = process.env.PINCODE_API_URL || 'https://api.postalpincode.in/pincode/';
const cache = new Map();

router.get('/pincode/:pin', wrap(async (req, res) => {
  const pin = req.params.pin;
  if (!/^\d{6}$/.test(pin)) {
    return res.status(400).json({ error: 'Pincode must be 6 digits' });
  }

  const cachedPlace = cache.get(pin);
  if (cachedPlace) return res.json(cachedPlace);

  let data;
  try {
    const response = await fetch(`${API_URL}${pin}`, {
      signal: AbortSignal.timeout(5000),
    });
    data = await response.json();
  } catch (error) {
    return res.status(502).json({
      error: 'Pincode service is not reachable right now. Type the location yourself.',
    });
  }

  const result = Array.isArray(data) ? data[0] : null;
  const office = result?.Status === 'Success' && result.PostOffice
    ? result.PostOffice[0]
    : null;

  if (!office) {
    return res.status(404).json({ error: 'No place found for this pincode' });
  }

  const place = {
    pincode: pin,
    area: office.Name,
    city: office.District,
    state: office.State,
  };
  cache.set(pin, place);
  return res.json(place);
}));

module.exports = router;
