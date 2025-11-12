// Shopping Debate Popup Controller

document.addEventListener('DOMContentLoaded', checkConfiguration);

// Open settings page
document.getElementById('settings-btn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Test debate on current page
document.getElementById('test-btn').addEventListener('click', testOnCurrentPage);

// Check if API key is configured
async function checkConfiguration() {
  const statusDisplay = document.getElementById('status-display');

  try {
    chrome.storage.sync.get(['apiKey'], (result) => {
      const apiKey = result.apiKey;

      if (apiKey && apiKey.trim() && apiKey.startsWith('sk-or-')) {
        statusDisplay.textContent = 'Ready to debate!';
        statusDisplay.className = 'status configured';
      } else {
        statusDisplay.textContent = 'Please configure your API key';
        statusDisplay.className = 'status not-configured';
      }
    });
  } catch (error) {
    statusDisplay.textContent = 'Error checking configuration';
    statusDisplay.className = 'status not-configured';
  }
}

// Test debate on current page
async function testOnCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject content script if not already present
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content/index.js']
      });
    } catch (e) {
      // Script might already be injected, that's ok
    }

    // Inject CSS
    try {
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['src/content/debate-modal.css']
      });
    } catch (e) {
      // CSS might already be injected, that's ok
    }

    // Trigger debate by simulating checkout detection
    await chrome.tabs.sendMessage(tab.id, {
      action: 'triggerDebate',
      force: true
    });

    window.close();
  } catch (error) {
    alert('Error starting debate: ' + error.message + '\n\nMake sure the page is fully loaded.');
  }
}
