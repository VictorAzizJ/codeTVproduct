// Options page JavaScript

// Load saved settings
document.addEventListener('DOMContentLoaded', loadSettings);

// Form submit handler
document.getElementById('settings-form').addEventListener('submit', saveSettings);

// Reset button handler
document.getElementById('reset-btn').addEventListener('click', resetToDefaults);

// Load settings from storage
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get({
      apiKey: '',
      model: 'openai/gpt-3.5-turbo',
      questionType: 'general',
      difficulty: 'medium',
      customPrompt: ''
    });

    // Populate form fields
    document.getElementById('apiKey').value = settings.apiKey;
    document.getElementById('model').value = settings.model;
    document.getElementById('questionType').value = settings.questionType;
    document.getElementById('difficulty').value = settings.difficulty;
    document.getElementById('customPrompt').value = settings.customPrompt;

  } catch (error) {
    showStatus('Error loading settings: ' + error.message, 'error');
  }
}

// Save settings to storage
async function saveSettings(e) {
  e.preventDefault();

  const apiKey = document.getElementById('apiKey').value.trim();
  const model = document.getElementById('model').value;
  const questionType = document.getElementById('questionType').value;
  const difficulty = document.getElementById('difficulty').value;
  const customPrompt = document.getElementById('customPrompt').value.trim();

  // Validate API key
  if (!apiKey) {
    showStatus('Please enter your OpenRouter API key', 'error');
    return;
  }

  if (!apiKey.startsWith('sk-or-')) {
    showStatus('Warning: API key should start with "sk-or-"', 'error');
    return;
  }

  try {
    // Save to Chrome storage
    await chrome.storage.sync.set({
      apiKey,
      model,
      questionType,
      difficulty,
      customPrompt
    });

    showStatus('Settings saved successfully!', 'success');

    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      hideStatus();
    }, 3000);

  } catch (error) {
    showStatus('Error saving settings: ' + error.message, 'error');
  }
}

// Reset to default settings
async function resetToDefaults() {
  if (!confirm('Are you sure you want to reset all settings to defaults? Your API key will be cleared.')) {
    return;
  }

  try {
    await chrome.storage.sync.set({
      apiKey: '',
      model: 'openai/gpt-3.5-turbo',
      questionType: 'general',
      difficulty: 'medium',
      customPrompt: ''
    });

    // Reload form
    loadSettings();
    showStatus('Settings reset to defaults', 'success');

    setTimeout(() => {
      hideStatus();
    }, 3000);

  } catch (error) {
    showStatus('Error resetting settings: ' + error.message, 'error');
  }
}

// Show status message
function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  statusEl.style.display = 'block';
}

// Hide status message
function hideStatus() {
  const statusEl = document.getElementById('status');
  statusEl.style.display = 'none';
}

// Add real-time validation for API key
document.getElementById('apiKey').addEventListener('input', (e) => {
  const value = e.target.value;
  if (value && !value.startsWith('sk-or-')) {
    e.target.style.borderColor = '#dc3545';
  } else {
    e.target.style.borderColor = '#e0e0e0';
  }
});
