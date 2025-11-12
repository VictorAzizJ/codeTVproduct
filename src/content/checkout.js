const CHECKOUT_PATTERNS = [
  /checkout/i, /cart/i, /basket/i, /payment/i, 
  /order-review/i, /purchase/i, /pay/i
];

export function isCheckoutPage() {
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();
  const bodyText = document.body.innerText.toLowerCase().substring(0, 1000);

  return CHECKOUT_PATTERNS.some(pattern => 
    pattern.test(url) || 
    pattern.test(title)
  ) || [
    'place order', 'complete purchase', 
    'pay now', 'confirm order'
  ].some(keyword => bodyText.includes(keyword));
}

export function initCheckoutDetection(showQuizCallback) {
  let quizShown = false;
  let lastUrl = location.href;
  
  function checkAndShow() {
    if (isCheckoutPage() && !quizShown) {
      quizShown = true;
      setTimeout(showQuizCallback, 1000);
    }
  }
  
  // Initial check
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndShow);
  } else {
    checkAndShow();
  }
  
  // SPA support
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      quizShown = false;
      checkAndShow();
    }
  }).observe(document, { subtree: true, childList: true });
}