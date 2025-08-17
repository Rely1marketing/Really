let currentCampaignId = null;
let selectedVariant = 'auto';

function showError(message) {
  const div = document.getElementById('error');
  if (div) {
    div.innerText = message;
  }
}

async function generate() {
  const goal = document.getElementById('goal').value;
  const res = await fetch('/campaigns/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal })
  });
  if (!res.ok) {
    console.error('Request failed', res.status);
    showError('Failed to generate campaign');
    return;
  }
  const data = await res.json();
  showError('');
  currentCampaignId = data.campaign_id || 1; // placeholder
  const div = document.getElementById('variants');
  div.innerHTML = '';
  data.variants.forEach(v => {
    const btn = document.createElement('button');
    btn.innerText = v.variant + ': ' + v.text;
    btn.onclick = () => { selectedVariant = v.variant; };
    div.appendChild(btn);
  });
}

async function sendSelected() {
  if (!currentCampaignId) return;
  const res = await fetch('/campaigns/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaign_id: currentCampaignId, variant: selectedVariant, contacts: [1] })
  });
  if (!res.ok) {
    console.error('Request failed', res.status);
    showError('Failed to send campaign');
    return;
  }
  showError('');
}

async function loadMetrics() {
  const res = await fetch('/dashboard');
  if (!res.ok) {
    console.error('Request failed', res.status);
    showError('Failed to load metrics');
    return;
  }
  const data = await res.json();
  showError('');
  const div = document.getElementById('metrics');
  div.innerText = `Sent last 7 days: ${data.messages_last_7_days}\nCTR: ${data.ctr}%\nOpt-outs: ${data.opt_outs}`;
}

loadMetrics();
