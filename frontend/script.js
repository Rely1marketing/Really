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
  try {
    const res = await fetch('/campaigns/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal })
    });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    showError('');
    currentCampaignId = data.campaign_id || 1; // placeholder
    const div = document.getElementById('variants');
    div.innerHTML = '';
    data.variants.forEach(v => {
      const p = document.createElement('p');
      p.innerText = v.variant + ': ' + v.text;
      p.onclick = () => {
        selectedVariant = v.variant;
        Array.from(div.children).forEach(c => c.classList.remove('selected'));
        p.classList.add('selected');
      };
      div.appendChild(p);
    });
  } catch (e) {
    console.error('Request failed', e);
    showError('Failed to generate campaign');
  }
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
  try {
    const res = await fetch('/dashboard');
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    showError('');
    const div = document.getElementById('metrics');
    div.innerText = `Sent last 7 days: ${data.messages_last_7_days}\nCTR: ${data.ctr}%\nOpt-outs: ${data.opt_outs}`;
  } catch (e) {
    console.error('Request failed', e);
    showError('Failed to load metrics');
    // Populate with default values so the dashboard still renders
    const div = document.getElementById('metrics');
    div.innerText = 'Sent last 7 days: 0\nCTR: 0%\nOpt-outs: 0';
  }
}

loadMetrics();
