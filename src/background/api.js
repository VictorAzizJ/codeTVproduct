import { generateQuestion } from './question.js';

export function handleMessages(request, sender, sendResponse) {
  if (request.action === 'getQuestion') {
    generateQuestion(request.settings)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
}