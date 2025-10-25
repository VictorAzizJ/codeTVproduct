// Popup JavaScript

document.addEventListener('DOMContentLoaded', checkConfiguration);

// Open settings page
document.getElementById('settings-btn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Test quiz on current page
document.getElementById('test-btn').addEventListener('click', testOnCurrentPage);

// Check if API key is configured
async function checkConfiguration() {
  const statusDisplay = document.getElementById('status-display');

  try {
    const { apiKey } = await chrome.storage.sync.get('apiKey');

    if (apiKey && apiKey.trim()) {
      statusDisplay.textContent = '✅ Extension is configured and ready!';
      statusDisplay.className = 'status configured';
    } else {
      statusDisplay.textContent = '⚠️ Please configure your API key in settings';
      statusDisplay.className = 'status not-configured';
    }
  } catch (error) {
    statusDisplay.textContent = '❌ Error checking configuration';
    statusDisplay.className = 'status not-configured';
  }
}

// Test quiz on current page
async function testOnCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject content script if not already present
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    // Inject CSS
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['quiz-modal.css']
    });

    // Trigger quiz by sending message
    await chrome.tabs.sendMessage(tab.id, { action: 'showQuiz' });

    window.close();
  } catch (error) {
    alert('Error testing quiz: ' + error.message);
  }
}
