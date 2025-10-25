// Content script: /statusLine/message-handler.js
// Receives structured messages from the background script and performs safe DOM updates,
// alerts, confirmations, and selection reads. This script must be included in the extension package.

(function() {
  'use strict';

  // Create status line DOM element if it doesn't exist
  function ensureStatusLine() {
    if (document.getElementById('status-line')) return;

    try {
      // Container
      const container = document.createElement('div');
      container.id = 'status-line';
      // Keep minimal inline styles; optional: rely on inserted CSS file
      container.style.position = 'fixed';
      container.style.bottom = '8px';
      container.style.left = '8px';
      container.style.zIndex = 999999;
      container.style.pointerEvents = 'auto';

      // Inner text element
      const text = document.createElement('div');
      text.id = 'status-line-text';
      text.style.background = 'rgba(0,0,0,0.8)';
      text.style.color = '#fff';
      text.style.padding = '6px 10px';
      text.style.borderRadius = '4px';
      text.style.fontSize = '12px';
      text.style.maxWidth = '60vw';
      text.style.overflowWrap = 'break-word';
      text.style.whiteSpace = 'pre-wrap';

      container.appendChild(text);
      document.body.appendChild(container);
    } catch (e) {
      console.warn("statusLine: could not create status line", e);
    }
  }

  // Remove status line
  function removeStatusLine() {
    const el = document.getElementById('status-line');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  // Safely set the status text (use textContent / innerText, not innerHTML)
  function setStatusText(s) {
    ensureStatusLine();
    const t = document.getElementById('status-line-text');
    if (t) {
      t.innerText = String(s);
    }
  }

  // Handler for incoming messages from background script
  browser.runtime.onMessage.addListener((msg, sender) => {
    try {
      if (!msg || !msg.action) return Promise.resolve();

      switch (msg.action) {
        case 'status':
          setStatusText(msg.message || '');
          return Promise.resolve(true);

        case 'deleteStatus':
          removeStatusLine();
          return Promise.resolve(true);

        case 'alert':
          // Use native alert (the page's context), pass string coercion
          alert(String(msg.message || ''));
          return Promise.resolve(true);

        case 'confirm':
          // Use native confirm and return boolean result
          const ok = confirm(String(msg.message || ''));
          return Promise.resolve(Boolean(ok));

        case 'getSelection':
          // Return the page selection (may be empty string)
          try {
            const sel = window.getSelection ? window.getSelection().toString() : '';
            return Promise.resolve(sel);
          } catch (e) {
            return Promise.resolve('');
          }

        default:
          return Promise.resolve();
      }
    } catch (e) {
      console.error('message-handler error', e);
      return Promise.resolve();
    }
  });

  // Optionally, make sure we create the status line when the script loads
  // so immediate status updates can be shown without waiting for ensure calls.
  // Do not populate text here.
})();
