document.addEventListener('DOMContentLoaded', async () => {
  const serverUrlInput = document.getElementById('serverUrl');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');

  const result = await chrome.storage.sync.get(['serverUrl']);
  serverUrlInput.value = result.serverUrl || 'http://localhost:3000';

  saveBtn.addEventListener('click', async () => {
    const url = serverUrlInput.value.trim();
    await chrome.storage.sync.set({ serverUrl: url });

    const tabs = await chrome.tabs.query({ url: 'https://docs.google.com/presentation/*' });
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { action: 'reconnect', serverUrl: url });
    }

    saveBtn.textContent = 'Saved!';
    setTimeout(() => saveBtn.textContent = 'Save & Connect', 1500);
  });

  document.getElementById('joinBtn').addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({ url: 'https://docs.google.com/presentation/*' });
    for (const tab of tabs) chrome.tabs.sendMessage(tab.id, { action: 'toggle-join' });
  });

  testBtn.addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0] && tabs[0].url.includes('docs.google.com/presentation')) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'test' });
    } else {
      alert('Open a Google Slides presentation first!');
    }
  });
});
