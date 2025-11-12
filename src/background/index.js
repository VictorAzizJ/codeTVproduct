import { OpenRouter } from '@openrouter/sdk';

// Development fallback API key (from .env)
const DEV_API_KEY = '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';

// Message handler for content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateDebateStreaming') {
    // Can't use sendResponse with async/streaming, so use long-lived connection
    handleStreamingDebate(request, sender.tab.id);
    return true;
  }

  // Keep backward compatibility with old quiz system if needed
  if (request.action === 'getQuestion') {
    sendResponse({ error: 'Legacy quiz mode not supported. Use debate mode.' });
    return false;
  }
});

async function handleStreamingDebate(request, tabId) {
  const { productContext, settings } = request;

  // Use settings API key or fallback to dev key
  const apiKey = settings?.apiKey || DEV_API_KEY;

  console.log('[Background] Using API key:', {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey?.substring(0, 10),
    model: settings?.model || 'anthropic/claude-3-haiku',
    source: settings?.apiKey ? 'settings' : 'fallback'
  });

  const openrouter = new OpenRouter({
    apiKey: apiKey,
    defaultHeaders: {
      "HTTP-Referer": chrome.runtime.getURL(''),
      "X-Title": "Shopping Debate Extension"
    }
  });

  try {
    // Capture responses for context building
    const responses = {};

    // 1. Enabler - The enthusiastic supporter
    responses.enabler = await streamPersonality(
      'enabler',
      buildEnablerPrompt(productContext),
      openrouter,
      settings,
      tabId
    );

    // Small pause between personalities for natural conversation flow
    await sleep(400);

    // 2. Skeptic - The pragmatic questioner
    responses.skeptic = await streamPersonality(
      'skeptic',
      buildSkepticPrompt(productContext),
      openrouter,
      settings,
      tabId
    );

    await sleep(400);

    // 3. Mediator - Synthesizes both perspectives
    await streamPersonality(
      'mediator',
      buildMediatorPrompt(productContext, responses),
      openrouter,
      settings,
      tabId
    );

    // Signal that the debate is complete
    chrome.tabs.sendMessage(tabId, {
      type: 'debateComplete'
    });

  } catch (error) {
    console.error('Debate generation error:', error);
    chrome.tabs.sendMessage(tabId, {
      type: 'debateError',
      error: error.message || 'Failed to generate debate'
    });
  }
}

async function streamPersonality(personality, prompt, openrouter, settings, tabId) {
  // Signal that this personality is starting
  chrome.tabs.sendMessage(tabId, {
    type: 'personalityStart',
    personality: personality
  });

  let fullResponse = ''; // Capture complete response for Mediator context

  try {
    const stream = await openrouter.chat.send({
      model: settings.model || 'anthropic/claude-3-haiku',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 250,
      temperature: 0.8,
      stream: true
    });

    for await (const chunk of stream) {
      // OpenRouter SDK chunk format: chunk.choices[0]?.delta?.content
      const content = chunk.choices?.[0]?.delta?.content || '';

      if (content) {
        fullResponse += content;

        // Send each chunk to the content script for real-time display
        chrome.tabs.sendMessage(tabId, {
          type: 'personalityChunk',
          personality: personality,
          content: content
        });
      }
    }

    // Signal this personality is done
    chrome.tabs.sendMessage(tabId, {
      type: 'personalityComplete',
      personality: personality
    });

    return fullResponse; // Return for Mediator context

  } catch (error) {
    console.error(`Error streaming ${personality}:`, error);
    throw error;
  }
}

function buildEnablerPrompt(productContext) {
  const { productName, price, pageTitle } = productContext;

  return `You are "The Enabler" - an enthusiastic but genuine AI personality helping someone consider purchasing: "${productName}" for ${price}.

Your role is to:
- Find authentic value and benefits in this purchase
- Create vivid, specific scenarios of how this improves their life
- Be supportive of their desires without being manipulative
- Stay enthusiastic but grounded in reality
- Reference the actual product name and price

Context: They're shopping on "${pageTitle}"

Respond in 2-3 compelling sentences. Be warm, specific to this product, and genuinely helpful.`;
}

function buildSkepticPrompt(productContext) {
  const { productName, price, pageTitle } = productContext;

  return `You are "The Skeptic" - a thoughtful, analytical AI personality helping someone consider purchasing: "${productName}" for ${price}.

Your role is to:
- Raise important practical questions and considerations
- Compare real cost vs real value
- Suggest alternatives or waiting strategies worth considering
- Be measured and rational, not judgmental or negative
- Reference the actual product and price

Context: They're shopping on "${pageTitle}"

Respond in 2-3 thought-provoking sentences. Be helpful and constructive, not discouraging.`;
}

function buildMediatorPrompt(productContext, previousResponses) {
  const { productName, price, pageTitle } = productContext;

  return `You are "The Mediator" - a balanced AI personality helping someone think through purchasing: "${productName}" for ${price}.

The Enabler said: "${previousResponses.enabler}"

The Skeptic said: "${previousResponses.skeptic}"

Your role is to:
- Acknowledge BOTH perspectives specifically
- Build on their points using "yes, and..." thinking
- Help identify what really matters for THIS specific decision
- Ask one clarifying question that synthesizes both views
- Guide toward thoughtful decision-making without forcing an outcome

Context: They're shopping on "${pageTitle}"

Respond in 2-3 sentences that directly reference and build upon what both the Enabler and Skeptic said. End with a single insightful question.`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('Shopping Debate background service worker loaded with OpenRouter SDK');
