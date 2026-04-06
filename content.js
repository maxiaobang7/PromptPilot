// content.js — Injected into supported AI chat sites

(function () {
  'use strict';

  // Site-specific selectors for input areas and send buttons
  const SITE_CONFIG = {
    deepseek: {
      match: 'chat.deepseek.com',
      inputSelector: 'textarea#chat-input, textarea[placeholder], div[contenteditable="true"].chat-input, textarea',
      sendSelector: 'button[class*="send"], button[aria-label*="Send"], div[class*="send"] button, button[class*="btn"]:has(svg)',
      useContentEditable: false
    },
    chatgpt: {
      match: 'chatgpt.com',
      inputSelector: '#prompt-textarea, div[id="prompt-textarea"], textarea[data-id="root"], div[contenteditable="true"][id="prompt-textarea"]',
      sendSelector: 'button[data-testid="send-button"], button[aria-label="Send prompt"], button[class*="send"]',
      useContentEditable: true
    },
    chatgptOld: {
      match: 'chat.openai.com',
      inputSelector: '#prompt-textarea, textarea[data-id="root"], div[contenteditable="true"]',
      sendSelector: 'button[data-testid="send-button"], button[aria-label="Send prompt"]',
      useContentEditable: true
    },
    gemini: {
      match: 'gemini.google.com',
      inputSelector: 'div.ql-editor[contenteditable="true"], rich-textarea .ql-editor, div[contenteditable="true"][aria-label], .text-input-field textarea, div[role="textbox"]',
      sendSelector: 'button.send-button, button[aria-label*="Send"], button[aria-label*="发送"], button[data-mat-icon-name="send"], .send-button-container button',
      useContentEditable: true
    },
    claude: {
      match: 'claude.ai',
      inputSelector: 'div[contenteditable="true"].ProseMirror, div[contenteditable="true"][data-placeholder], div.ProseMirror[contenteditable="true"]',
      sendSelector: 'button[aria-label="Send Message"], button[aria-label*="Send"], button[data-testid="send-button"]',
      useContentEditable: true
    },
    yuanbao: {
      match: 'yuanbao.tencent.com',
      inputSelector: 'textarea#chat-input, div[contenteditable="true"], textarea[class*="input"], textarea',
      sendSelector: 'button[class*="send"], div[class*="send-btn"], button:has(svg[class*="send"])',
      useContentEditable: false
    }
  };

  function detectSite() {
    const url = window.location.href;
    for (const [key, config] of Object.entries(SITE_CONFIG)) {
      if (url.includes(config.match)) return config;
    }
    return null;
  }

  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element not found: ${selector}`));
      }, timeout);
    });
  }

  function findElement(selectorStr) {
    const selectors = selectorStr.split(',').map(s => s.trim());
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el) return el;
      } catch (e) { /* skip invalid selectors */ }
    }
    return null;
  }

  function setInputValue(el, text, useContentEditable) {
    // Focus the element first
    el.focus();
    el.click();

    if (useContentEditable || el.contentEditable === 'true') {
      // For contenteditable divs (ChatGPT, Claude, Gemini)
      // Clear existing content
      el.innerHTML = '';

      // Create a paragraph for each line
      const lines = text.split('\n');
      if (lines.length === 1) {
        el.innerHTML = `<p>${escapeHtml(text)}</p>`;
      } else {
        el.innerHTML = lines.map(line =>
          `<p>${line === '' ? '<br>' : escapeHtml(line)}</p>`
        ).join('');
      }

      // Dispatch events to notify frameworks
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));

      // Move cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      // For textareas (DeepSeek, YuanBao)
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      ).set;
      nativeInputValueSetter.call(el, text);

      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));

      // Also try React-specific approach
      const tracker = el._valueTracker;
      if (tracker) {
        tracker.setValue('');
      }
      el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    }

    // Extra: try using execCommand for wider compatibility
    try {
      if (useContentEditable || el.contentEditable === 'true') {
        // Already handled above
      }
    } catch (e) { /* ignore */ }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function clickSend(siteConfig) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const btn = findElement(siteConfig.sendSelector);
        if (btn && !btn.disabled) {
          btn.click();
          resolve(true);
        } else {
          // Retry after a short delay (button might become enabled after input)
          setTimeout(() => {
            const btn2 = findElement(siteConfig.sendSelector);
            if (btn2 && !btn2.disabled) {
              btn2.click();
              resolve(true);
            } else {
              // Try pressing Enter as fallback
              const input = findElement(siteConfig.inputSelector);
              if (input) {
                input.dispatchEvent(new KeyboardEvent('keydown', {
                  key: 'Enter',
                  code: 'Enter',
                  keyCode: 13,
                  which: 13,
                  bubbles: true
                }));
              }
              resolve(false);
            }
          }, 500);
        }
      }, 300);
    });
  }

  // Listen for fill requests from the background/sidepanel
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FILL_PROMPT') {
      const siteConfig = detectSite();
      if (!siteConfig) {
        sendResponse({ success: false, error: '当前网站不受支持' });
        return;
      }

      const input = findElement(siteConfig.inputSelector);
      if (!input) {
        sendResponse({ success: false, error: '未找到输入框，请确保页面已完全加载' });
        return;
      }

      try {
        setInputValue(input, message.text, siteConfig.useContentEditable);

        if (message.autoSend) {
          clickSend(siteConfig).then((sent) => {
            sendResponse({ success: true, sent });
          });
          return true; // async
        } else {
          sendResponse({ success: true, sent: false });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    }
    return true;
  });

  // Notify that content script is loaded
  console.log('[PromptPilot] Content script loaded for', window.location.hostname);
})();
