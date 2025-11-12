/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/content/checkout.js":
/*!*********************************!*\
  !*** ./src/content/checkout.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initCheckoutDetection: () => (/* binding */ initCheckoutDetection),
/* harmony export */   isCheckoutPage: () => (/* binding */ isCheckoutPage)
/* harmony export */ });
var CHECKOUT_PATTERNS = [/checkout/i, /cart/i, /basket/i, /payment/i, /order-review/i, /purchase/i, /pay/i];
function isCheckoutPage() {
  var url = window.location.href.toLowerCase();
  var title = document.title.toLowerCase();
  var bodyText = document.body.innerText.toLowerCase().substring(0, 1000);
  return CHECKOUT_PATTERNS.some(function (pattern) {
    return pattern.test(url) || pattern.test(title);
  }) || ['place order', 'complete purchase', 'pay now', 'confirm order'].some(function (keyword) {
    return bodyText.includes(keyword);
  });
}
function initCheckoutDetection(showQuizCallback) {
  var quizShown = false;
  var lastUrl = location.href;
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
  new MutationObserver(function () {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      quizShown = false;
      checkAndShow();
    }
  }).observe(document, {
    subtree: true,
    childList: true
  });
}

/***/ }),

/***/ "./src/content/quiz/controller.js":
/*!****************************************!*\
  !*** ./src/content/quiz/controller.js ***!
  \****************************************/
/***/ (() => {

function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
// Content script that detects checkout pages and displays quiz

// Checkout detection patterns
var CHECKOUT_PATTERNS = [/checkout/i, /cart/i, /basket/i, /payment/i, /order-review/i, /purchase/i, /pay/i];

// Check if current page is a checkout page
function isCheckoutPage() {
  var url = window.location.href.toLowerCase();
  var title = document.title.toLowerCase();
  var bodyText = document.body.innerText.toLowerCase().substring(0, 1000);

  // Check URL
  if (CHECKOUT_PATTERNS.some(function (pattern) {
    return pattern.test(url);
  })) {
    return true;
  }

  // Check page title
  if (CHECKOUT_PATTERNS.some(function (pattern) {
    return pattern.test(title);
  })) {
    return true;
  }

  // Check for common checkout buttons/text
  var checkoutKeywords = ['place order', 'complete purchase', 'pay now', 'confirm order'];
  if (checkoutKeywords.some(function (keyword) {
    return bodyText.includes(keyword);
  })) {
    return true;
  }
  return false;
}

// Check if quiz has been completed for this session
var quizCompleted = false;
var quizShown = false;

// Show quiz modal
function showQuizModal() {
  if (quizShown) return;
  quizShown = true;

  // Create modal overlay
  var overlay = document.createElement('div');
  overlay.id = 'study-checkout-overlay';
  overlay.innerHTML = "\n    <div class=\"study-checkout-modal\">\n      <div class=\"modal-header\">\n        <h2>\uD83D\uDCDA Time to Learn Before You Shop!</h2>\n        <p>Answer this question correctly to proceed to checkout</p>\n      </div>\n      <div class=\"modal-body\">\n        <div id=\"question-container\">\n          <div class=\"loading\">Loading your question...</div>\n        </div>\n        <div id=\"answer-container\" style=\"display: none;\">\n          <input type=\"text\" id=\"answer-input\" placeholder=\"Type your answer here...\" />\n          <button id=\"submit-answer\">Submit Answer</button>\n        </div>\n        <div id=\"feedback-container\"></div>\n      </div>\n      <div class=\"modal-footer\">\n        <small>Study Checkout Extension</small>\n      </div>\n    </div>\n  ";
  document.body.appendChild(overlay);

  // Block page interaction
  blockPageInteraction();

  // Load question
  loadQuestion();
}

// Block all page interactions
function blockPageInteraction() {
  var overlay = document.getElementById('study-checkout-overlay');

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
  var overlay = document.getElementById('study-checkout-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// Load question from background script (which calls OpenRouter)
function loadQuestion() {
  return _loadQuestion.apply(this, arguments);
} // Display question in modal
function _loadQuestion() {
  _loadQuestion = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
    var settings, _t;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          _context.p = 0;
          _context.n = 1;
          return chrome.storage.sync.get({
            questionType: 'general',
            difficulty: 'medium',
            customPrompt: ''
          });
        case 1:
          settings = _context.v;
          // Request question from background script
          chrome.runtime.sendMessage({
            action: 'getQuestion',
            settings: settings
          }, function (response) {
            if (response.error) {
              displayError(response.error);
            } else {
              displayQuestion(response.question, response.correctAnswer);
            }
          });
          _context.n = 3;
          break;
        case 2:
          _context.p = 2;
          _t = _context.v;
          displayError('Failed to load question: ' + _t.message);
        case 3:
          return _context.a(2);
      }
    }, _callee, null, [[0, 2]]);
  }));
  return _loadQuestion.apply(this, arguments);
}
function displayQuestion(question, correctAnswer) {
  var questionContainer = document.getElementById('question-container');
  var answerContainer = document.getElementById('answer-container');
  questionContainer.innerHTML = "<div class=\"question\">".concat(question, "</div>");
  answerContainer.style.display = 'block';

  // Store correct answer
  window.studyCheckoutAnswer = correctAnswer;

  // Set up submit handler
  var submitBtn = document.getElementById('submit-answer');
  var answerInput = document.getElementById('answer-input');
  submitBtn.onclick = checkAnswer;
  answerInput.onkeypress = function (e) {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  };

  // Focus input
  answerInput.focus();
}

// Check user's answer
function checkAnswer() {
  var answerInput = document.getElementById('answer-input');
  var userAnswer = answerInput.value.trim();
  var correctAnswer = window.studyCheckoutAnswer;
  var feedbackContainer = document.getElementById('feedback-container');

  // Simple answer checking (case-insensitive, trimmed)
  if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
    feedbackContainer.innerHTML = "\n      <div class=\"feedback success\">\n        \u2705 Correct! Great job! You can now proceed with your purchase.\n      </div>\n    ";
    setTimeout(function () {
      unblockPage();
    }, 2000);
  } else {
    feedbackContainer.innerHTML = "\n      <div class=\"feedback error\">\n        \u274C Not quite right. Try again!<br>\n        <small>Hint: ".concat(correctAnswer.substring(0, 2), "...</small>\n      </div>\n    ");
    answerInput.value = '';
    answerInput.focus();
  }
}

// Display error
function displayError(errorMessage) {
  var questionContainer = document.getElementById('question-container');
  questionContainer.innerHTML = "\n    <div class=\"error\">\n      \u26A0\uFE0F Error loading question: ".concat(errorMessage, "\n      <br><br>\n      <button onclick=\"location.reload()\">Reload Page</button>\n    </div>\n  ");
}

// Initialize on page load
function init() {
  // Check if this is a checkout page
  if (isCheckoutPage()) {
    console.log('Checkout page detected!');

    // Small delay to ensure page is fully loaded
    setTimeout(function () {
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
var lastUrl = location.href;
new MutationObserver(function () {
  var currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    quizShown = false;
    quizCompleted = false;
    init();
  }
}).observe(document, {
  subtree: true,
  childList: true
});

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/*!******************************!*\
  !*** ./src/content/index.js ***!
  \******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _checkout_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./checkout.js */ "./src/content/checkout.js");
/* harmony import */ var _quiz_controller_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./quiz/controller.js */ "./src/content/quiz/controller.js");
/* harmony import */ var _quiz_controller_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_quiz_controller_js__WEBPACK_IMPORTED_MODULE_1__);


(0,_checkout_js__WEBPACK_IMPORTED_MODULE_0__.initCheckoutDetection)(_quiz_controller_js__WEBPACK_IMPORTED_MODULE_1__.showQuizModal);
})();

/******/ })()
;
//# sourceMappingURL=content.bundle.js.map