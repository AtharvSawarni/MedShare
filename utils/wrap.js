// Catches errors in async route handlers and replies with a 500 instead of crashing the server
module.exports = (fn) => (req, res) => fn(req, res).catch((e) => res.status(500).json({ error: e.message }));
