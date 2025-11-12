// Content script that detects checkout pages and displays quiz

// Checkout detection patterns
const CHECKOUT_PATTERNS = [
  /checkout/i,
  /cart/i,
  /basket/i,
  /payment/i,
  /order-review/i,
  /purchase/i,
  /pay/i
];

// Check if current page is a checkout page
function isCheckoutPage() {
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();
  const bodyText = document.body.innerText.toLowerCase().substring(0, 1000);

  // Check URL
  if (CHECKOUT_PATTERNS.some(pattern => pattern.test(url))) {
    return true;
  }

  // Check page title
  if (CHECKOUT_PATTERNS.some(pattern => pattern.test(title))) {
    return true;
  }

  // Check for common checkout buttons/text
  const checkoutKeywords = ['place order', 'complete purchase', 'pay now', 'confirm order'];
  if (checkoutKeywords.some(keyword => bodyText.includes(keyword))) {
    return true;
  }

  return false;
}

// Check if quiz has been completed for this session
let quizCompleted = false;
let quizShown = false;

// Show quiz modal
function showQuizModal() {
  if (quizShown) return;
  quizShown = true;

  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'study-checkout-overlay';
  overlay.innerHTML = `
    <div class="study-checkout-modal">
      <div class="modal-header">
        <h2>📚 Time to Learn Before You Shop!</h2>
        <p>Answer this question correctly to proceed to checkout</p>
      </div>
      <div class="modal-body">
        <div id="question-container">
          <div class="loading">Loading your question...</div>
        </div>
        <div id="answer-container" style="display: none;">
          <input type="text" id="answer-input" placeholder="Type your answer here..." />
          <button id="submit-answer">Submit Answer</button>
        </div>
        <div id="feedback-container"></div>
      </div>
      <div class="modal-footer">
        <small>Study Checkout Extension</small>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Block page interaction
  blockPageInteraction();

  // Load question
  loadQuestion();
}

// Block all page interactions
function blockPageInteraction() {
  const overlay = document.getElementById('study-checkout-overlay');

  // Prevent clicks on the page
  document.addEventListener('click', preventClick, true);
  document.addEventListener('submit', preventSubmit, true);

  // Prevent keyboard shortcuts
  document.addEventListener('keydown', preventKeys, true);
}

function preventClick(e) {
  if (!e.target.closest('.study-checkout-modal')) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}

function preventSubmit(e) {
  if (!quizCompleted && !e.target.closest('.study-checkout-modal')) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}

function preventKeys(e) {
  // Allow typing in quiz modal
  if (e.target.closest('.study-checkout-modal')) {
    return;
  }
  // Block other keys
  e.preventDefault();
  e.stopPropagation();
  return false;
}

// Unblock page
function unblockPage() {
  quizCompleted = true;
  document.removeEventListener('click', preventClick, true);
  document.removeEventListener('submit', preventSubmit, true);
  document.removeEventListener('keydown', preventKeys, true);

  const overlay = document.getElementById('study-checkout-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// Load question from background script (which calls OpenRouter)
async function loadQuestion() {
  try {
    // Get user preferences
    const settings = await chrome.storage.sync.get({
      questionType: 'general',
      difficulty: 'medium',
      customPrompt: ''
    });

    // Request question from background script
    chrome.runtime.sendMessage({
      action: 'getQuestion',
      settings: settings
    }, (response) => {
      if (response.error) {
        displayError(response.error);
      } else {
        displayQuestion(response.question, response.correctAnswer);
      }
    });
  } catch (error) {
    displayError('Failed to load question: ' + error.message);
  }
}

// Display question in modal
function displayQuestion(question, correctAnswer) {
  const questionContainer = document.getElementById('question-container');
  const answerContainer = document.getElementById('answer-container');

  questionContainer.innerHTML = `<div class="question">${question}</div>`;
  answerContainer.style.display = 'block';

  // Store correct answer
  window.studyCheckoutAnswer = correctAnswer;

  // Set up submit handler
  const submitBtn = document.getElementById('submit-answer');
  const answerInput = document.getElementById('answer-input');

  submitBtn.onclick = checkAnswer;
  answerInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  };

  // Focus input
  answerInput.focus();
}

// Check user's answer
function checkAnswer() {
  const answerInput = document.getElementById('answer-input');
  const userAnswer = answerInput.value.trim();
  const correctAnswer = window.studyCheckoutAnswer;
  const feedbackContainer = document.getElementById('feedback-container');

  // Simple answer checking (case-insensitive, trimmed)
  if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
    feedbackContainer.innerHTML = `
      <div class="feedback success">
        ✅ Correct! Great job! You can now proceed with your purchase.
      </div>
    `;

    setTimeout(() => {
      unblockPage();
    }, 2000);
  } else {
    feedbackContainer.innerHTML = `
      <div class="feedback error">
        ❌ Not quite right. Try again!<br>
        <small>Hint: ${correctAnswer.substring(0, 2)}...</small>
      </div>
    `;
    answerInput.value = '';
    answerInput.focus();
  }
}

// Display error
function displayError(errorMessage) {
  const questionContainer = document.getElementById('question-container');
  questionContainer.innerHTML = `
    <div class="error">
      ⚠️ Error loading question: ${errorMessage}
      <br><br>
      <button onclick="location.reload()">Reload Page</button>
    </div>
  `;
}

// Initialize on page load
function init() {
  // Check if this is a checkout page
  if (isCheckoutPage()) {
    console.log('Checkout page detected!');

    // Small delay to ensure page is fully loaded
    setTimeout(() => {
      showQuizModal();
    }, 1000);
  }
}

// Run when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Also watch for URL changes (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    quizShown = false;
    quizCompleted = false;
    init();
  }
}).observe(document, { subtree: true, childList: true });
