// background.js — Service Worker for PromptPilot

// Open side panel on extension icon click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Listen for messages from side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FILL_PROMPT') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'FILL_PROMPT',
          text: message.text,
          autoSend: message.autoSend
        }, (response) => {
          sendResponse(response || { success: false, error: 'No response from content script' });
        });
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });
    return true; // keep channel open for async
  }

  if (message.type === 'CHECK_SITE') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const url = tabs[0].url || '';
        const supported = [
          'chat.deepseek.com',
          'chatgpt.com',
          'chat.openai.com',
          'gemini.google.com',
          'claude.ai',
          'yuanbao.tencent.com'
        ];
        const isSupportedSite = supported.some(d => url.includes(d));
        const siteName = getSiteName(url);
        sendResponse({ supported: isSupportedSite, siteName, url });
      } else {
        sendResponse({ supported: false, siteName: '', url: '' });
      }
    });
    return true;
  }
});

function getSiteName(url) {
  if (url.includes('chat.deepseek.com')) return 'DeepSeek';
  if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) return 'ChatGPT';
  if (url.includes('gemini.google.com')) return 'Gemini';
  if (url.includes('claude.ai')) return 'Claude';
  if (url.includes('yuanbao.tencent.com')) return '腾讯元宝';
  return '';
}
