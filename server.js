require('dotenv').config();
const path = require('path');
const express = require('express');
const { engine } = require('express-handlebars');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Handlebars: views/layouts/main.handlebars wraps every page, views/partials holds the navbar and footer
app.engine('handlebars', engine({ helpers: { eq: (a, b) => a === b } }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // only public/ is served: CSS, JS and images

app.use('/api', require('./routes/medicines'));
app.use('/api', require('./routes/requests'));
app.use('/api', require('./routes/auth'));
app.use('/', require('./routes/pages'));

connectDB()
  .then(() => app.listen(PORT, () => console.log(`MedShare running at http://localhost:${PORT}`)))
  .catch((err) => { console.error('Could not start the server:', err.message); process.exit(1); });
