const STORAGE_KEY = 'lunchRatings';
const WEBHOOK_SETTINGS_KEY = 'webhookSettings';

async function getRatings() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] || {};
}

async function saveRatings(ratings) {
  await chrome.storage.local.set({ [STORAGE_KEY]: ratings });
}

async function getWebhookSettings() {
  const data = await chrome.storage.local.get(WEBHOOK_SETTINGS_KEY);
  return data[WEBHOOK_SETTINGS_KEY] || { enabled: false, url: '', headers: {} };
}

async function saveWebhookSettings(settings) {
  await chrome.storage.local.set({ [WEBHOOK_SETTINGS_KEY]: settings });
}

function renderList(containerId, items, emptyMsgId, onRemove) {
  const ul = document.getElementById(containerId);
  const emptyMsg = document.getElementById(emptyMsgId);

  ul.innerHTML = '';
  if (items.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  items.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;

    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.className = 'remove';
    btn.addEventListener('click', () => onRemove(name));

    li.appendChild(btn);
    ul.appendChild(li);
  });
}

async function initOptions() {
  const ratings = await getRatings();
  const liked    = [];
  const neutral  = [];
  const disliked = [];

  for (const [name, value] of Object.entries(ratings)) {
    if (value === 1)    liked.push(name);
    if (value === 0.5)  neutral.push(name);
    if (value === -1)   disliked.push(name);
  }

  renderList('liked-list',    liked,    'no-liked',    removeFromLiked);
  renderList('neutral-list',  neutral,  'no-neutral',  removeFromNeutral);
  renderList('disliked-list', disliked, 'no-disliked', removeFromDisliked);

  // Load webhook settings
  const webhookSettings = await getWebhookSettings();
  document.getElementById('webhook-enabled').checked = webhookSettings.enabled;
  document.getElementById('webhook-url').value = webhookSettings.url || '';
  document.getElementById('webhook-headers').value = JSON.stringify(webhookSettings.headers || {}, null, 2);
  
  // Show/hide webhook config based on enabled state
  const webhookConfig = document.getElementById('webhook-config');
  webhookConfig.style.display = webhookSettings.enabled ? 'block' : 'none';
}

async function removeFromLiked(name) {
  const ratings = await getRatings();
  delete ratings[name];
  await saveRatings(ratings);
  initOptions();  // re-render
}

async function removeFromNeutral(name) {
  const ratings = await getRatings();
  delete ratings[name];
  await saveRatings(ratings);
  initOptions();  // re-render
}

async function removeFromDisliked(name) {
  const ratings = await getRatings();
  delete ratings[name];
  await saveRatings(ratings);
  initOptions();  // re-render
}

document.addEventListener('DOMContentLoaded', () => {
  initOptions();

  const newItemInput    = document.getElementById('new-item-input');
  const addLikedBtn     = document.getElementById('add-liked-btn');
  const addNeutralBtn   = document.getElementById('add-neutral-btn');
  const addDislikedBtn  = document.getElementById('add-disliked-btn');

  addLikedBtn.addEventListener('click', async () => {
    const name = newItemInput.value.trim();
    if (!name) return;
    const ratings = await getRatings();
    ratings[name] = 1;
    await saveRatings(ratings);
    newItemInput.value = '';
    initOptions();
  });

  addNeutralBtn.addEventListener('click', async () => {
    const name = newItemInput.value.trim();
    if (!name) return;
    const ratings = await getRatings();
    ratings[name] = 0.5;
    await saveRatings(ratings);
    newItemInput.value = '';
    initOptions();
  });

  addDislikedBtn.addEventListener('click', async () => {
    const name = newItemInput.value.trim();
    if (!name) return;
    const ratings = await getRatings();
    ratings[name] = -1;
    await saveRatings(ratings);
    newItemInput.value = '';
    initOptions();
  });

  // NEW: export/import controls
  const exportBtn   = document.getElementById('export-btn');
  const importInput = document.getElementById('import-input');

  exportBtn.addEventListener('click', async () => {
    const ratings = await getRatings();
    const blob    = new Blob([JSON.stringify(ratings, null, 2)], { type: 'application/json' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href        = url;
    a.download    = 'lunchRatings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  importInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const text = await file.text();
    let imported;
    try {
      imported = JSON.parse(text);
    } catch {
      alert('Invalid JSON file');
      return;
    }
    // overwrite existing ratings
    await saveRatings(imported);
    initOptions();
    importInput.value = '';
  });

  // Webhook settings
  const webhookEnabled = document.getElementById('webhook-enabled');
  const webhookConfig = document.getElementById('webhook-config');
  const webhookUrl = document.getElementById('webhook-url');
  const webhookHeaders = document.getElementById('webhook-headers');
  const saveWebhookBtn = document.getElementById('save-webhook-btn');
  const testWebhookBtn = document.getElementById('test-webhook-btn');

  webhookEnabled.addEventListener('change', () => {
    webhookConfig.style.display = webhookEnabled.checked ? 'block' : 'none';
  });

  saveWebhookBtn.addEventListener('click', async () => {
    let headers = {};
    try {
      if (webhookHeaders.value.trim()) {
        headers = JSON.parse(webhookHeaders.value);
      }
    } catch (error) {
      alert('Invalid JSON in headers field');
      return;
    }

    const settings = {
      enabled: webhookEnabled.checked,
      url: webhookUrl.value.trim(),
      headers: headers
    };

    await saveWebhookSettings(settings);
    alert('Webhook settings saved!');
  });

  testWebhookBtn.addEventListener('click', async () => {
    const url = webhookUrl.value.trim();
    if (!url) {
      alert('Please enter a webhook URL first');
      return;
    }

    let headers = { 'Content-Type': 'application/json' };
    try {
      if (webhookHeaders.value.trim()) {
        headers = { ...headers, ...JSON.parse(webhookHeaders.value) };
      }
    } catch (error) {
      alert('Invalid JSON in headers field');
      return;
    }

    const testPayload = {
      lunchName: "Test Lunch Item",
      rating: 1,
      timestamp: new Date().toISOString(),
      source: "rozvoz-specialit-rater",
      test: true
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        alert(`Webhook test successful! Status: ${response.status}`);
      } else {
        alert(`Webhook test failed! Status: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      alert(`Webhook test failed! Error: ${error.message}`);
    }
  });
});
