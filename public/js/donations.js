function donationStatusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

async function loadMyDonations() {
  const body = document.getElementById('donations-body');
  const response = await API.get('/api/donations');
  if (!response.ok) {
    body.innerHTML = '<tr><td colspan="6">Could not load your donations.</td></tr>';
    return;
  }

  if (response.data.length === 0) {
    body.innerHTML = '<tr><td colspan="6">You have not submitted any donations yet.</td></tr>';
    return;
  }

  body.innerHTML = response.data.map((donation) => `
    <tr>
      <td>${escapeHTML(donation.name)}<span class="row-sub">${escapeHTML(donation.category)}</span></td>
      <td>${escapeHTML(donation.quantity)}</td>
      <td>${escapeHTML(donation.location)}<span class="row-sub">${escapeHTML(donation.address || 'Address not provided')}</span></td>
      <td>${escapeHTML(donation.expiry)}</td>
      <td><span class="status ${escapeHTML(donation.status)}">${donationStatusLabel(donation.status)}</span></td>
      <td>${donation.createdAt ? new Date(donation.createdAt).toLocaleDateString() : '—'}</td>
    </tr>
  `).join('');
}

loadMyDonations();
