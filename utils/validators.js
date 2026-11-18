const STATUSES = ['available', 'pending', 'approved', 'fulfilled', 'rejected'];

// Accepts "YYYY-MM-DD" (date input) or "YYYY-MM" (treated as the last day of that month)
function parseExpiry(value) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value || '');
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), m[3] ? Number(m[3]) : 0];
  const date = d ? new Date(y, mo - 1, d) : new Date(y, mo, 0);
  return isNaN(date) ? null : date;
}

// "2027-06" becomes "2027-06-30", so every stored expiry is a full date and sorts correctly as text
function normalizeExpiry(value) {
  const m = /^(\d{4})-(\d{2})$/.exec(value || '');
  if (!m) return value;
  const lastDay = new Date(Number(m[1]), Number(m[2]), 0).getDate();
  return `${m[1]}-${m[2]}-${String(lastDay).padStart(2, '0')}`;
}

// Returns an object of errors (empty object = valid). New donations need 1+ month left; edits only need a valid date.
function validateMedicine(b, requireOneMonth) {
  const errors = {};
  ['name', 'category', 'expiry', 'quantity', 'location'].forEach((k) => {
    if (!b[k] || !String(b[k]).trim()) errors[k] = 'This field is required';
  });
  if (b.expiry && !errors.expiry) {
    const date = parseExpiry(b.expiry);
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() + 1);
    if (!date || (requireOneMonth && date < minDate)) {
      errors.expiry = requireOneMonth ? 'Expiry must be at least 1 month from today' : 'Enter a valid expiry date';
    }
  }
  return errors;
}

module.exports = { STATUSES, parseExpiry, normalizeExpiry, validateMedicine };
