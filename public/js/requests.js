function requestStatusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

async function loadMyRequests() {
  const body = document.getElementById('requests-body');
  const [requestResponse, medicineResponse] = await Promise.all([
    API.get('/api/requests'),
    API.get('/api/medicines'),
  ]);

  if (!requestResponse.ok || !medicineResponse.ok) {
    body.innerHTML = '<tr><td colspan="5">Could not load your requests.</td></tr>';
    return;
  }

  const medicines = new Map(medicineResponse.data.map((medicine) => [medicine.id, medicine]));
  const requests = requestResponse.data;
  if (requests.length === 0) {
    body.innerHTML = '<tr><td colspan="5">You have not submitted any requests yet.</td></tr>';
    return;
  }

  body.innerHTML = requests.map((request) => {
    const medicine = medicines.get(request.medicineId);
    const submitted = request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '—';
    return `
      <tr>
        <td>${escapeHTML(medicine ? medicine.name : 'Medicine no longer available')}</td>
        <td>${escapeHTML(request.quantity)}</td>
        <td>${escapeHTML(request.deliveryAddress)}</td>
        <td>${submitted}</td>
        <td><span class="status ${escapeHTML(request.status)}">${requestStatusLabel(request.status)}</span></td>
      </tr>`;
  }).join('');
}

loadMyRequests();
