const express = require('express');
const Medicine = require('../models/Medicine');
const Request = require('../models/Request');
const wrap = require('../utils/wrap');
const { currentUser } = require('./auth');

const router = express.Router();

// One list of categories, used by the Donate form, the Browse filters and the dashboard edit dialog
const CATEGORIES = ['Antibiotics', 'Cardiology', 'Diabetes', 'Pain Relievers', 'Pediatric', 'Respiratory', 'Other'];
router.use((req, res, next) => {
  res.locals.categories = CATEGORIES;
  next();
});

// Landing page: the numbers come from MongoDB and are filled into the template
router.get(['/', '/index.html'], wrap(async (req, res) => {
  const [donated, fulfilled, organisations] = await Promise.all([
    Medicine.countDocuments(),
    Request.countDocuments({ status: 'fulfilled' }),
    Request.distinct('requesterName').then((names) => names.length),
  ]);
  res.render('index', {
    title: "MedShare \u2014 Don't waste unexpired medicines",
    active: 'index',
    stats: { donated, fulfilled, organisations },
  });
}));

// The other pages only need a title, a script and a CSS class for <main>
const pages = {
  donate:    { title: 'Donate Medicine \u2014 MedShare',  script: 'donate.js',    mainClass: 'donate-page' },
  browse:    { title: 'Browse Medicines \u2014 MedShare', script: 'browse.js',    mainClass: 'browse-page' },
  dashboard: { title: 'Dashboard (NGO) \u2014 MedShare',  script: 'dashboard.js', mainClass: 'dashboard-page' },
  signin:    { title: 'Sign In \u2014 MedShare',          script: 'auth.js',      mainClass: 'donate-page' },
  request:   { title: 'Request Medicine \u2014 MedShare', script: 'request.js',   mainClass: 'donate-page' },
  requests:  { title: 'My Requests \u2014 MedShare',     script: 'requests.js',  mainClass: 'dashboard-page' },
  donations: { title: 'My Donations \u2014 MedShare',    script: 'donations.js', mainClass: 'dashboard-page' },
  medicine:  { title: 'Medicine Details \u2014 MedShare', script: 'medicine.js',  mainClass: 'donate-page' },
};

Object.entries(pages).forEach(([name, options]) => {
  router.get('/' + name + '.html', (req, res) => {
    const user = currentUser(req);
    if (name === 'signin') {
      if (user) {
        const requested = req.query.returnTo;
        if (typeof requested === 'string' && requested.startsWith('/') && !requested.startsWith('//')) {
          return res.redirect(requested);
        }
        return res.redirect(user.role === 'ngo' ? '/dashboard.html' : user.role === 'donor' ? '/donations.html' : '/requests.html');
      }
    }
    if (name === 'dashboard') {
      if (!user) return res.redirect('/signin.html');
      if (user.role !== 'ngo') return res.status(403).send('NGO access required');
    }
    if (name === 'donate' && user && user.role !== 'donor') {
      return res.redirect(user.role === 'ngo' ? '/dashboard.html' : '/requests.html');
    }
    if (name === 'request' && user && user.role !== 'requester') {
      return res.redirect(user.role === 'ngo' ? '/dashboard.html' : '/donations.html');
    }
    if (name === 'browse' && user?.role === 'donor') {
      return res.redirect('/donate.html');
    }
    if (name === 'browse' && user?.role === 'ngo') {
      return res.redirect('/dashboard.html');
    }
    if (name === 'requests') {
      if (!user) return res.redirect('/signin.html');
      if (user.role !== 'requester') return res.status(403).send('Requester access required');
    }
    if (name === 'donations') {
      if (!user) return res.redirect('/signin.html');
      if (user.role !== 'donor') return res.status(403).send('Donor access required');
    }
    return res.render(name, { ...options, active: name, currentUser: user });
  });
});

module.exports = router;
