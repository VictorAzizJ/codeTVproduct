import { buildPrompt } from './prompt.js';

export async function generateQuestion(settings) {
  try {
     const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error('API key not configured');
    
    const prompt = buildPrompt(settings);
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
            content: 'You are a helpful quiz generator...'
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
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (e) {
      return parseQuestionFromText(content);
    }
  } catch (error) {
    console.error('Question generation error:', error);
    throw error;
  }
}

function parseQuestionFromText(text) {
  const questionMatch = text.match(/[Qq]uestion[:\s]+(.+?)(?=[Aa]nswer|$)/s);
  const answerMatch = text.match(/[Aa]nswer[:\s]+(.+?)$/s);

  return {
    question: questionMatch?.[1]?.trim() || text.substring(0, 200),
    answer: answerMatch?.[1]?.trim() || 'Unable to parse answer'
  };
}