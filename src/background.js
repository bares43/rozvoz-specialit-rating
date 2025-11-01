// Background script for handling webhook calls
const WEBHOOK_SETTINGS_KEY = 'webhookSettings';

async function getWebhookSettings() {
  const data = await chrome.storage.local.get(WEBHOOK_SETTINGS_KEY);
  return data[WEBHOOK_SETTINGS_KEY] || {};
}

async function callWebhook(dishName, rating) {
  try {
    const settings = await getWebhookSettings();
    if (!settings.url || !settings.enabled) return;

    const payload = {
      lunchName: dishName,
      rating: rating,
      timestamp: new Date().toISOString(),
      source: 'rozvoz-specialit-rater'
    };

    const response = await fetch(settings.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(settings.headers || {})
      },
      body: JSON.stringify(payload)
    });

    console.log('Webhook response:', response.status, response.statusText);
  } catch (error) {
    console.error('Webhook call failed:', error);
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'webhook') {
    callWebhook(message.dishName, message.rating);
    sendResponse({ success: true });
  }
});