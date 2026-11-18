# MedShare: Phase 3 testing checklist

## Setup
- [ ] `git pull`, `npm install`, `.env` has `MONGODB_URI`
- [ ] `npm run seed` (first time only), then `npm start` prints "MongoDB connected" and "MedShare running"

## 1. API tests with Postman
- [ ] Import `docs/MedShare.postman_collection.json` into Postman
- [ ] Collection variable `baseUrl` is `http://localhost:3000`
- [ ] Run the whole collection with the Runner (26 requests). Every test should be green.
- [ ] Folders run in order: Medicines, Requests, Cleanup, Auth (each saves ids for the next)

## 2. Dashboard (http://localhost:3000/dashboard.html)
- [ ] Stat cards show real numbers
- [ ] Recent Activity table: every row has 6 cells, status appears once
- [ ] Approve a pending donation: status becomes Available, toast shows
- [ ] Approve then Fulfil a request
- [ ] Manage Inventory lists all medicines, nearest expiry first
- [ ] Edit: dialog opens prefilled; empty name shows an inline error; Save updates the table
- [ ] Delete: Cancel keeps the medicine; OK removes it (and its requests)

## 3. Full flow for the demo (about 2 minutes)
1. [ ] Donate a medicine (Donate page). It appears as Pending on the dashboard.
2. [ ] Approve it on the dashboard. It becomes Available.
3. [ ] Open Browse: it shows in FEFO order with the right expiry badge.
4. [ ] Open its details page, click Request, submit the form.
5. [ ] Dashboard: Approve, then Fulfil the request. "Fulfilled Requests" goes up by one.
6. [ ] Edit the medicine, then delete the test data.

## 4. Edge cases
- [ ] Donate with an expiry less than 1 month away: error shown
- [ ] Open `medicine.html?id=zzz`: "Medicine not found"
- [ ] Register twice with the same email: error shown
- [ ] Wrong password: "Invalid email or password"
- [ ] `/server.js`, `/.env` and `/data/medicines.json` in the browser show nothing (403)

## Before the demo
- [ ] Atlas Network Access allows your IP (or `0.0.0.0/0`)
- [ ] Do not delete the demo medicines; only delete test items
- [ ] Laptop charged, server started once to check, `.env` present
