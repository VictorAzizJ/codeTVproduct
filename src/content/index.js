import { initCheckoutDetection, isCheckoutPage } from './checkout.js';

// Initialize debate system when checkout is detected
initCheckoutDetection(showDebateModal);

// Setup message listener for streaming and triggers
chrome.runtime.onMessage.addListener((message) => {
  // Handle manual trigger from popup
  if (message.action === 'triggerDebate' && message.force) {
    showDebateModal();
    return;
  }

  // Handle streaming messages
  handleStreamingMessage(message);
});

function showDebateModal() {
  // Extract product context from the page
  const productContext = extractProductContext();

  // Create and show the debate modal
  const modal = createDebateModal(productContext);
  document.body.appendChild(modal);

  // Load settings and start the debate
  chrome.storage.sync.get(['apiKey', 'model'], (settings) => {
    if (!settings.apiKey) {
      showDebateError('Please configure your OpenRouter API key in extension settings');
      return;
    }

    // Send message to background script to start streaming debate
    chrome.runtime.sendMessage({
      action: 'generateDebateStreaming',
      productContext,
      settings
    });
  });
}

function createDebateModal(productContext) {
  const modal = document.createElement('div');
  modal.id = 'shopping-debate-modal';
  modal.innerHTML = `
    <div class="debate-overlay"></div>
    <div class="debate-container">
      <div class="debate-header">
        <h2>Before you checkout...</h2>
        <p class="product-name">${escapeHtml(productContext.productName)}</p>
        <p class="product-price">${escapeHtml(productContext.price)}</p>
      </div>

      <div class="debate-content">
        <div class="debate-conversation">
          <!-- Enabler -->
          <div class="personality enabler" style="display: none;">
            <div class="personality-header">
              <span class="personality-name">The Enabler</span>
            </div>
            <p class="personality-message"></p>
          </div>

          <!-- Skeptic -->
          <div class="personality skeptic" style="display: none;">
            <div class="personality-header">
              <span class="personality-name">The Skeptic</span>
            </div>
            <p class="personality-message"></p>
          </div>

          <!-- Mediator -->
          <div class="personality mediator" style="display: none;">
            <div class="personality-header">
              <span class="personality-name">The Mediator</span>
            </div>
            <p class="personality-message"></p>
          </div>
        </div>

        <div class="debate-loading" style="display: block;">
          <div class="loading-spinner"></div>
          <p>Starting debate...</p>
        </div>
      </div>

      <div class="debate-actions" style="display: none;">
        <button class="btn-proceed">Complete Purchase</button>
        <button class="btn-reconsider">Maybe Not Today</button>
      </div>

      <div class="debate-error" style="display: none;">
        <p class="error-message"></p>
        <button class="btn-close">Close</button>
      </div>
    </div>
  `;

  // Wire up action buttons
  modal.querySelector('.btn-proceed').addEventListener('click', () => {
    modal.remove();
  });

  modal.querySelector('.btn-reconsider').addEventListener('click', () => {
    if (confirm('Taking time to think it over is wise. Close this tab?')) {
      window.close();
    } else {
      modal.remove();
    }
  });

  modal.querySelector('.btn-close')?.addEventListener('click', () => {
    modal.remove();
  });

  return modal;
}

function handleStreamingMessage(message) {
  const modal = document.getElementById('shopping-debate-modal');
  if (!modal) return; // Modal was closed

  switch (message.type) {
    case 'personalityStart':
      hideLoadingSpinner();
      showPersonality(message.personality);
      break;

    case 'personalityChunk':
      appendToPersonality(message.personality, message.content);
      break;

    case 'personalityComplete':
      // Optional: add visual indication that personality finished
      markPersonalityComplete(message.personality);
      break;

    case 'debateComplete':
      showActionButtons();
      break;

    case 'debateError':
      showDebateError(message.error);
      break;
  }
}

function hideLoadingSpinner() {
  const loading = document.querySelector('.debate-loading');
  if (loading) {
    loading.style.display = 'none';
  }
}

function showPersonality(personality) {
  const element = document.querySelector(`.personality.${personality}`);
  if (element) {
    element.style.display = 'block';
    // Smooth appearance animation
    setTimeout(() => {
      element.classList.add('appear');
    }, 50);
  }
}

function appendToPersonality(personality, content) {
  const messageElement = document.querySelector(`.personality.${personality} .personality-message`);
  if (messageElement) {
    messageElement.textContent += content;

    // Auto-scroll the debate content to show new text
    const container = document.querySelector('.debate-content');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}

function markPersonalityComplete(personality) {
  const element = document.querySelector(`.personality.${personality}`);
  if (element) {
    element.classList.add('complete');
  }
}

function showActionButtons() {
  const actions = document.querySelector('.debate-actions');
  if (actions) {
    actions.style.display = 'flex';

    // Smooth appearance
    setTimeout(() => {
      actions.classList.add('appear');
    }, 100);
  }
}

function showDebateError(errorMessage) {
  const errorDiv = document.querySelector('.debate-error');
  const errorText = document.querySelector('.error-message');
  const conversation = document.querySelector('.debate-conversation');
  const loading = document.querySelector('.debate-loading');

  if (errorText) {
    errorText.textContent = `Error: ${errorMessage}`;
  }

  if (errorDiv) {
    errorDiv.style.display = 'block';
  }

  if (conversation) {
    conversation.style.display = 'none';
  }

  if (loading) {
    loading.style.display = 'none';
  }
}

function extractProductContext() {
  // Try to extract product information from the page
  const pageTitle = document.title;

  // Try to find product name
  let productName = 'this item';
  const h1 = document.querySelector('h1');
  if (h1 && h1.textContent.trim()) {
    productName = h1.textContent.trim();
  } else if (pageTitle) {
    // Remove common e-commerce suffixes from title
    productName = pageTitle
      .replace(/\s*[-–|]\s*(Checkout|Cart|Payment|Order|Buy|Shop).*$/i, '')
      .trim();
  }

  // Try to find price
  let price = '';
  const priceSelectors = [
    '[data-price]',
    '.price',
    '[class*="price"]',
    '[id*="price"]',
    '[class*="total"]',
    '[id*="total"]'
  ];

  for (const selector of priceSelectors) {
    const priceElement = document.querySelector(selector);
    if (priceElement) {
      const text = priceElement.textContent.trim();
      const priceMatch = text.match(/[\$£€¥]\s*[\d,]+\.?\d*/);
      if (priceMatch) {
        price = priceMatch[0];
        break;
      }
    }
  }

  // Fallback: search for any price-like pattern in the visible text
  if (!price) {
    const bodyText = document.body.innerText;
    const priceMatch = bodyText.match(/Total:?\s*([\$£€¥]\s*[\d,]+\.?\d*)/i);
    if (priceMatch) {
      price = priceMatch[1];
    } else {
      price = 'an undisclosed amount';
    }
  }

  return {
    productName: productName.substring(0, 100), // Limit length
    price: price,
    pageTitle: pageTitle.substring(0, 100),
    url: window.location.href
  };
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

console.log('Shopping Debate content script loaded');
