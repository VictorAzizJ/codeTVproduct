export function buildPrompt(settings) {
  const { questionType, difficulty, customPrompt } = settings;
  
  if (customPrompt?.trim()) {
    return `${customPrompt}\n\nGenerate one question at ${difficulty} difficulty. Return as JSON: {"question": "...", "answer": "..."}`;
  }

  const basePrompt = {
    'math': 'Generate a math problem',
    'science': 'Generate a science question (biology, chemistry, or physics)',
    'history': 'Generate a history question',
    'geography': 'Generate a geography question',
    'language': 'Generate a vocabulary or grammar question',
    'trivia': 'Generate a fun trivia question',
    'general': 'Generate a general knowledge question'
  }[questionType] || 'Generate a general knowledge question';

  return `${basePrompt} at ${difficulty} difficulty. The answer should be 1-3 words. Return as JSON: {"question": "...", "answer": "..."}`;
}