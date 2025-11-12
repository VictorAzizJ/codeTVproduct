import { handleMessages } from './api.js';
import { generateQuestion } from './question.js';

chrome.runtime.onMessage.addListener(handleMessages);