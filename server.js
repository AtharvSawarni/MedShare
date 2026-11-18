require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// Never expose server code, data files or secrets to the browser
app.use(
  ['/data', '/config', '/models', '/routes', '/utils', '/server.js', '/seed.js', '/package.json', '/node_modules', '/.env'],
  (req, res) => res.status(403).end()
);
app.use(express.static(__dirname));

app.use('/api', require('./routes/medicines'));
app.use('/api', require('./routes/requests'));
app.use('/api', require('./routes/auth'));

connectDB()
  .then(() => app.listen(PORT, () => console.log(`MedShare running at http://localhost:${PORT}`)))
  .catch((err) => { console.error('Could not start the server:', err.message); process.exit(1); });
