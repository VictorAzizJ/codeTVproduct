// Background service worker for API calls to OpenRouter

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getQuestion') {
    generateQuestion(request.settings)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep channel open for async response
  }
});

// Generate question using OpenRouter API
async function generateQuestion(settings) {
  try {
    // Get API key from storage
    const { apiKey } = await chrome.storage.sync.get('apiKey');

    if (!apiKey) {
      throw new Error('OpenRouter API key not configured. Please add it in the extension settings.');
    }

    // Build prompt based on user settings
    const prompt = buildPrompt(settings);

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': chrome.runtime.getURL(''),
        'X-Title': 'Study Checkout Extension'
      },
      body: JSON.stringify({
        model: settings.model || 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful quiz generator. Generate a single question with a short answer (1-3 words). Format your response as JSON with "question" and "answer" fields. Keep answers simple and unambiguous.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the response
    let questionData;
    try {
      // Try to parse as JSON first
      questionData = JSON.parse(content);
    } catch (e) {
      // If not JSON, try to extract question and answer manually
      questionData = parseQuestionFromText(content);
    }

    return {
      question: questionData.question,
      correctAnswer: questionData.answer
    };

  } catch (error) {
    console.error('Error generating question:', error);
    throw error;
  }
}

// Build prompt based on user settings
function buildPrompt(settings) {
  const { questionType, difficulty, customPrompt } = settings;

  if (customPrompt && customPrompt.trim()) {
    return `${customPrompt}\n\nGenerate one question at ${difficulty} difficulty level. Return as JSON: {"question": "...", "answer": "..."}`;
  }

  let basePrompt = '';

  switch (questionType) {
    case 'math':
      basePrompt = 'Generate a math problem';
      break;
    case 'science':
      basePrompt = 'Generate a science question (biology, chemistry, or physics)';
      break;
    case 'history':
      basePrompt = 'Generate a history question';
      break;
    case 'geography':
      basePrompt = 'Generate a geography question';
      break;
    case 'language':
      basePrompt = 'Generate a vocabulary or grammar question';
      break;
    case 'trivia':
      basePrompt = 'Generate a fun trivia question';
      break;
    case 'general':
    default:
      basePrompt = 'Generate a general knowledge question';
      break;
  }

  return `${basePrompt} at ${difficulty} difficulty level. The answer should be 1-3 words. Return as JSON: {"question": "...", "answer": "..."}`;
}

// Parse question from non-JSON text
function parseQuestionFromText(text) {
  // Try to find patterns like "Question: ... Answer: ..."
  const questionMatch = text.match(/[Qq]uestion[:\s]+(.+?)(?=[Aa]nswer|$)/s);
  const answerMatch = text.match(/[Aa]nswer[:\s]+(.+?)$/s);

  if (questionMatch && answerMatch) {
    return {
      question: questionMatch[1].trim(),
      answer: answerMatch[1].trim().replace(/[.!?]$/, '')
    };
  }

  // If parsing fails, return a fallback
  return {
    question: text.substring(0, 200),
    answer: 'Unable to parse answer'
  };
}

// Set default settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    questionType: 'general',
    difficulty: 'medium',
    model: 'openai/gpt-3.5-turbo',
    customPrompt: ''
  });
});
