let currentCampaignId = null;
let selectedVariant = 'auto';

async function generate() {
  const goal = document.getElementById('goal').value;
  const res = await fetch('/campaigns/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal })
  });
  const data = await res.json();
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
  await fetch('/campaigns/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaign_id: currentCampaignId, variant: selectedVariant, contacts: [1] })
  });
}

async function loadMetrics() {
  const res = await fetch('/dashboard');
  const data = await res.json();
  const div = document.getElementById('metrics');
  div.innerText = `Sent last 7 days: ${data.messages_last_7_days}\nCTR: ${data.ctr}%\nOpt-outs: ${data.opt_outs}`;
}

loadMetrics();
