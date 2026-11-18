const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const wrap = require('../utils/wrap');

const router = express.Router();
const hash = (password, salt) => crypto.scryptSync(password, salt, 32).toString('hex');

// ---------- sessions (kept in memory, cleared when the server restarts) ----------
const sessions = new Map(); // session id -> { name, email, role }

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((c) => c.trim().split('=')).filter(([key]) => key));
}
const currentUser = (req) => sessions.get(parseCookies(req.headers.cookie).sid) || null;

function startSession(res, user) {
  const sid = crypto.randomBytes(24).toString('hex');
  sessions.set(sid, user);
  // HttpOnly: JavaScript on the page cannot read this cookie, so XSS cannot steal it
  res.cookie('sid', sid, { httpOnly: true, sameSite: 'lax' });
}

// ---------- routes ----------
router.post('/register', wrap(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Name, email and a password of 6+ characters are required' });
  }
  const cleanEmail = String(email).toLowerCase().trim();
  if (await User.exists({ email: cleanEmail })) {
    return res.status(409).json({ error: 'This email is already registered' });
  }
  const salt = crypto.randomBytes(8).toString('hex');
  const created = await User.create({
    name, email: cleanEmail, role: role === 'ngo' ? 'ngo' : 'donor', salt, hash: hash(password, salt),
  });
  const user = { name: created.name, email: created.email, role: created.role };
  startSession(res, user); // registering also logs the user in
  res.status(201).json(user);
}));

router.post('/login', wrap(async (req, res) => {
  const { email = '', password = '' } = req.body;
  const found = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!found || found.hash !== hash(password, found.salt)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const user = { name: found.name, email: found.email, role: found.role };
  startSession(res, user);
  res.json(user);
}));

// Who is logged in? The server answers from the session cookie.
router.get('/me', (req, res) => {
  const user = currentUser(req);
  user ? res.json(user) : res.status(401).json({ error: 'Not logged in' });
});

router.post('/logout', (req, res) => {
  sessions.delete(parseCookies(req.headers.cookie).sid);
  res.clearCookie('sid');
  res.json({ ok: true });
});

module.exports = router;
module.exports.currentUser = currentUser;
