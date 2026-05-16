chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      notes:      [],
      saveCount:  0,
      isPro:      false,
      FREE_LIMIT: 20
    });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'OPEN_UPGRADE') {
    chrome.tabs.create({ url: 'https://glimpse.so/upgrade' });
  }
});
