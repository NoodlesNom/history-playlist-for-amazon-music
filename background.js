// Toolbar icon: open Song History in this tab when it is already Amazon Music,
// otherwise open it in a new tab. The in-page Make playlist button is unchanged.
const HISTORY_URL = 'https://music.amazon.com/recently/played/songs';

function isAmazonMusic(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && /^music\.amazon\.(com|ca|co\.uk|com\.au|in|ae)$/.test(parsed.hostname);
  } catch (err) {
    return false;
  }
}

chrome.action.onClicked.addListener((tab) => {
  if (tab && tab.id != null && isAmazonMusic(tab.url)) {
    chrome.tabs.update(tab.id, { url: HISTORY_URL });
    return;
  }
  chrome.tabs.create({ url: HISTORY_URL });
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (!message || message.type !== 'amhp-hard-reload') return;
  const tabId = sender && sender.tab && sender.tab.id;
  if (typeof tabId === 'number') chrome.tabs.reload(tabId, { bypassCache: true });
});

