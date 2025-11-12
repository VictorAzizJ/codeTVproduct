(() => {
  // src/content/checkout.js
  var CHECKOUT_PATTERNS = [
    /checkout/i,
    /cart/i,
    /basket/i,
    /payment/i,
    /order-review/i,
    /purchase/i,
    /pay/i
  ];
  function isCheckoutPage() {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    const bodyText = document.body.innerText.toLowerCase().substring(0, 1e3);
    return CHECKOUT_PATTERNS.some(
      (pattern) => pattern.test(url) || pattern.test(title)
    ) || [
      "place order",
      "complete purchase",
      "pay now",
      "confirm order"
    ].some((keyword) => bodyText.includes(keyword));
  }
  function initCheckoutDetection(showQuizCallback) {
    let quizShown = false;
    let lastUrl = location.href;
    function checkAndShow() {
      if (isCheckoutPage() && !quizShown) {
        quizShown = true;
        setTimeout(showQuizCallback, 1e3);
      }
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", checkAndShow);
    } else {
      checkAndShow();
    }
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        quizShown = false;
        checkAndShow();
      }
    }).observe(document, { subtree: true, childList: true });
  }

  // src/content/index.js
  initCheckoutDetection(showDebateModal);
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "triggerDebate" && message.force) {
      showDebateModal();
      return;
    }
    handleStreamingMessage(message);
  });
  function showDebateModal() {
    const productContext = extractProductContext();
    const modal = createDebateModal(productContext);
    document.body.appendChild(modal);
    chrome.storage.sync.get(["apiKey", "model"], (settings) => {
      if (!settings.apiKey) {
        showDebateError("Please configure your OpenRouter API key in extension settings");
        return;
      }
      chrome.runtime.sendMessage({
        action: "generateDebateStreaming",
        productContext,
        settings
      });
    });
  }
  function createDebateModal(productContext) {
    var _a;
    const modal = document.createElement("div");
    modal.id = "shopping-debate-modal";
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
    modal.querySelector(".btn-proceed").addEventListener("click", () => {
      modal.remove();
    });
    modal.querySelector(".btn-reconsider").addEventListener("click", () => {
      if (confirm("Taking time to think it over is wise. Close this tab?")) {
        window.close();
      } else {
        modal.remove();
      }
    });
    (_a = modal.querySelector(".btn-close")) == null ? void 0 : _a.addEventListener("click", () => {
      modal.remove();
    });
    return modal;
  }
  function handleStreamingMessage(message) {
    const modal = document.getElementById("shopping-debate-modal");
    if (!modal) return;
    switch (message.type) {
      case "personalityStart":
        hideLoadingSpinner();
        showPersonality(message.personality);
        break;
      case "personalityChunk":
        appendToPersonality(message.personality, message.content);
        break;
      case "personalityComplete":
        markPersonalityComplete(message.personality);
        break;
      case "debateComplete":
        showActionButtons();
        break;
      case "debateError":
        showDebateError(message.error);
        break;
    }
  }
  function hideLoadingSpinner() {
    const loading = document.querySelector(".debate-loading");
    if (loading) {
      loading.style.display = "none";
    }
  }
  function showPersonality(personality) {
    const element = document.querySelector(`.personality.${personality}`);
    if (element) {
      element.style.display = "block";
      setTimeout(() => {
        element.classList.add("appear");
      }, 50);
    }
  }
  function appendToPersonality(personality, content) {
    const messageElement = document.querySelector(`.personality.${personality} .personality-message`);
    if (messageElement) {
      messageElement.textContent += content;
      const container = document.querySelector(".debate-content");
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }
  function markPersonalityComplete(personality) {
    const element = document.querySelector(`.personality.${personality}`);
    if (element) {
      element.classList.add("complete");
    }
  }
  function showActionButtons() {
    const actions = document.querySelector(".debate-actions");
    if (actions) {
      actions.style.display = "flex";
      setTimeout(() => {
        actions.classList.add("appear");
      }, 100);
    }
  }
  function showDebateError(errorMessage) {
    const errorDiv = document.querySelector(".debate-error");
    const errorText = document.querySelector(".error-message");
    const conversation = document.querySelector(".debate-conversation");
    const loading = document.querySelector(".debate-loading");
    if (errorText) {
      errorText.textContent = `Error: ${errorMessage}`;
    }
    if (errorDiv) {
      errorDiv.style.display = "block";
    }
    if (conversation) {
      conversation.style.display = "none";
    }
    if (loading) {
      loading.style.display = "none";
    }
  }
  function extractProductContext() {
    const pageTitle = document.title;
    let productName = "this item";
    const h1 = document.querySelector("h1");
    if (h1 && h1.textContent.trim()) {
      productName = h1.textContent.trim();
    } else if (pageTitle) {
      productName = pageTitle.replace(/\s*[-–|]\s*(Checkout|Cart|Payment|Order|Buy|Shop).*$/i, "").trim();
    }
    let price = "";
    const priceSelectors = [
      "[data-price]",
      ".price",
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
    if (!price) {
      const bodyText = document.body.innerText;
      const priceMatch = bodyText.match(/Total:?\s*([\$£€¥]\s*[\d,]+\.?\d*)/i);
      if (priceMatch) {
        price = priceMatch[1];
      } else {
        price = "an undisclosed amount";
      }
    }
    return {
      productName: productName.substring(0, 100),
      // Limit length
      price,
      pageTitle: pageTitle.substring(0, 100),
      url: window.location.href
    };
  }
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  console.log("Shopping Debate content script loaded");
})();
