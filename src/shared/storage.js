export async function getSettings() {
  return chrome.storage.sync.get({
    apiKey: '',
    model: 'openai/gpt-3.5-turbo',
    questionType: 'general',
    difficulty: 'medium',
    customPrompt: ''
  });
}

export async function saveSettings(settings) {
  return chrome.storage.sync.set(settings);
}