/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/content/checkout.js":
/*!*********************************!*\
  !*** ./src/content/checkout.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   initCheckoutDetection: () => (/* binding */ initCheckoutDetection),\n/* harmony export */   isCheckoutPage: () => (/* binding */ isCheckoutPage)\n/* harmony export */ });\nvar CHECKOUT_PATTERNS = [/checkout/i, /cart/i, /basket/i, /payment/i, /order-review/i, /purchase/i, /pay/i];\nfunction isCheckoutPage() {\n  var url = window.location.href.toLowerCase();\n  var title = document.title.toLowerCase();\n  var bodyText = document.body.innerText.toLowerCase().substring(0, 1000);\n  return CHECKOUT_PATTERNS.some(function (pattern) {\n    return pattern.test(url) || pattern.test(title);\n  }) || ['place order', 'complete purchase', 'pay now', 'confirm order'].some(function (keyword) {\n    return bodyText.includes(keyword);\n  });\n}\nfunction initCheckoutDetection(showQuizCallback) {\n  var quizShown = false;\n  var lastUrl = location.href;\n  function checkAndShow() {\n    if (isCheckoutPage() && !quizShown) {\n      quizShown = true;\n      setTimeout(showQuizCallback, 1000);\n    }\n  }\n\n  // Initial check\n  if (document.readyState === 'loading') {\n    document.addEventListener('DOMContentLoaded', checkAndShow);\n  } else {\n    checkAndShow();\n  }\n\n  // SPA support\n  new MutationObserver(function () {\n    if (location.href !== lastUrl) {\n      lastUrl = location.href;\n      quizShown = false;\n      checkAndShow();\n    }\n  }).observe(document, {\n    subtree: true,\n    childList: true\n  });\n}\n\n//# sourceURL=webpack:///./src/content/checkout.js?\n}");

/***/ }),

/***/ "./src/content/index.js":
/*!******************************!*\
  !*** ./src/content/index.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _checkout_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./checkout.js */ \"./src/content/checkout.js\");\n/* harmony import */ var _quiz_controller_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./quiz/controller.js */ \"./src/content/quiz/controller.js\");\n/* harmony import */ var _quiz_controller_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_quiz_controller_js__WEBPACK_IMPORTED_MODULE_1__);\n\n\n(0,_checkout_js__WEBPACK_IMPORTED_MODULE_0__.initCheckoutDetection)(_quiz_controller_js__WEBPACK_IMPORTED_MODULE_1__.showQuizModal);\n\n//# sourceURL=webpack:///./src/content/index.js?\n}");

/***/ }),

/***/ "./src/content/quiz/controller.js":
/*!****************************************!*\
  !*** ./src/content/quiz/controller.js ***!
  \****************************************/
/***/ (() => {

eval("{function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = \"function\" == typeof Symbol ? Symbol : {}, n = r.iterator || \"@@iterator\", o = r.toStringTag || \"@@toStringTag\"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, \"_invoke\", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError(\"Generator is already running\"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = \"next\"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError(\"iterator result is not an object\"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i[\"return\"]) && t.call(i), c < 2 && (u = TypeError(\"The iterator does not provide a '\" + o + \"' method\"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, \"GeneratorFunction\")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, \"constructor\", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, \"constructor\", GeneratorFunction), GeneratorFunction.displayName = \"GeneratorFunction\", _regeneratorDefine2(GeneratorFunctionPrototype, o, \"GeneratorFunction\"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, \"Generator\"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, \"toString\", function () { return \"[object Generator]\"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }\nfunction _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, \"\", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o(\"next\", 0), o(\"throw\", 1), o(\"return\", 2)); }, _regeneratorDefine2(e, r, n, t); }\nfunction asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }\nfunction _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, \"next\", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, \"throw\", n); } _next(void 0); }); }; }\n// Content script that detects checkout pages and displays quiz\n\n// Checkout detection patterns\nvar CHECKOUT_PATTERNS = [/checkout/i, /cart/i, /basket/i, /payment/i, /order-review/i, /purchase/i, /pay/i];\n\n// Check if current page is a checkout page\nfunction isCheckoutPage() {\n  var url = window.location.href.toLowerCase();\n  var title = document.title.toLowerCase();\n  var bodyText = document.body.innerText.toLowerCase().substring(0, 1000);\n\n  // Check URL\n  if (CHECKOUT_PATTERNS.some(function (pattern) {\n    return pattern.test(url);\n  })) {\n    return true;\n  }\n\n  // Check page title\n  if (CHECKOUT_PATTERNS.some(function (pattern) {\n    return pattern.test(title);\n  })) {\n    return true;\n  }\n\n  // Check for common checkout buttons/text\n  var checkoutKeywords = ['place order', 'complete purchase', 'pay now', 'confirm order'];\n  if (checkoutKeywords.some(function (keyword) {\n    return bodyText.includes(keyword);\n  })) {\n    return true;\n  }\n  return false;\n}\n\n// Check if quiz has been completed for this session\nvar quizCompleted = false;\nvar quizShown = false;\n\n// Show quiz modal\nfunction showQuizModal() {\n  if (quizShown) return;\n  quizShown = true;\n\n  // Create modal overlay\n  var overlay = document.createElement('div');\n  overlay.id = 'study-checkout-overlay';\n  overlay.innerHTML = \"\\n    <div class=\\\"study-checkout-modal\\\">\\n      <div class=\\\"modal-header\\\">\\n        <h2>\\uD83D\\uDCDA Time to Learn Before You Shop!</h2>\\n        <p>Answer this question correctly to proceed to checkout</p>\\n      </div>\\n      <div class=\\\"modal-body\\\">\\n        <div id=\\\"question-container\\\">\\n          <div class=\\\"loading\\\">Loading your question...</div>\\n        </div>\\n        <div id=\\\"answer-container\\\" style=\\\"display: none;\\\">\\n          <input type=\\\"text\\\" id=\\\"answer-input\\\" placeholder=\\\"Type your answer here...\\\" />\\n          <button id=\\\"submit-answer\\\">Submit Answer</button>\\n        </div>\\n        <div id=\\\"feedback-container\\\"></div>\\n      </div>\\n      <div class=\\\"modal-footer\\\">\\n        <small>Study Checkout Extension</small>\\n      </div>\\n    </div>\\n  \";\n  document.body.appendChild(overlay);\n\n  // Block page interaction\n  blockPageInteraction();\n\n  // Load question\n  loadQuestion();\n}\n\n// Block all page interactions\nfunction blockPageInteraction() {\n  var overlay = document.getElementById('study-checkout-overlay');\n\n  // Prevent clicks on the page\n  document.addEventListener('click', preventClick, true);\n  document.addEventListener('submit', preventSubmit, true);\n\n  // Prevent keyboard shortcuts\n  document.addEventListener('keydown', preventKeys, true);\n}\nfunction preventClick(e) {\n  if (!e.target.closest('.study-checkout-modal')) {\n    e.preventDefault();\n    e.stopPropagation();\n    return false;\n  }\n}\nfunction preventSubmit(e) {\n  if (!quizCompleted && !e.target.closest('.study-checkout-modal')) {\n    e.preventDefault();\n    e.stopPropagation();\n    return false;\n  }\n}\nfunction preventKeys(e) {\n  // Allow typing in quiz modal\n  if (e.target.closest('.study-checkout-modal')) {\n    return;\n  }\n  // Block other keys\n  e.preventDefault();\n  e.stopPropagation();\n  return false;\n}\n\n// Unblock page\nfunction unblockPage() {\n  quizCompleted = true;\n  document.removeEventListener('click', preventClick, true);\n  document.removeEventListener('submit', preventSubmit, true);\n  document.removeEventListener('keydown', preventKeys, true);\n  var overlay = document.getElementById('study-checkout-overlay');\n  if (overlay) {\n    overlay.style.display = 'none';\n  }\n}\n\n// Load question from background script (which calls OpenRouter)\nfunction loadQuestion() {\n  return _loadQuestion.apply(this, arguments);\n} // Display question in modal\nfunction _loadQuestion() {\n  _loadQuestion = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {\n    var settings, _t;\n    return _regenerator().w(function (_context) {\n      while (1) switch (_context.p = _context.n) {\n        case 0:\n          _context.p = 0;\n          _context.n = 1;\n          return chrome.storage.sync.get({\n            questionType: 'general',\n            difficulty: 'medium',\n            customPrompt: ''\n          });\n        case 1:\n          settings = _context.v;\n          // Request question from background script\n          chrome.runtime.sendMessage({\n            action: 'getQuestion',\n            settings: settings\n          }, function (response) {\n            if (response.error) {\n              displayError(response.error);\n            } else {\n              displayQuestion(response.question, response.correctAnswer);\n            }\n          });\n          _context.n = 3;\n          break;\n        case 2:\n          _context.p = 2;\n          _t = _context.v;\n          displayError('Failed to load question: ' + _t.message);\n        case 3:\n          return _context.a(2);\n      }\n    }, _callee, null, [[0, 2]]);\n  }));\n  return _loadQuestion.apply(this, arguments);\n}\nfunction displayQuestion(question, correctAnswer) {\n  var questionContainer = document.getElementById('question-container');\n  var answerContainer = document.getElementById('answer-container');\n  questionContainer.innerHTML = \"<div class=\\\"question\\\">\".concat(question, \"</div>\");\n  answerContainer.style.display = 'block';\n\n  // Store correct answer\n  window.studyCheckoutAnswer = correctAnswer;\n\n  // Set up submit handler\n  var submitBtn = document.getElementById('submit-answer');\n  var answerInput = document.getElementById('answer-input');\n  submitBtn.onclick = checkAnswer;\n  answerInput.onkeypress = function (e) {\n    if (e.key === 'Enter') {\n      checkAnswer();\n    }\n  };\n\n  // Focus input\n  answerInput.focus();\n}\n\n// Check user's answer\nfunction checkAnswer() {\n  var answerInput = document.getElementById('answer-input');\n  var userAnswer = answerInput.value.trim();\n  var correctAnswer = window.studyCheckoutAnswer;\n  var feedbackContainer = document.getElementById('feedback-container');\n\n  // Simple answer checking (case-insensitive, trimmed)\n  if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {\n    feedbackContainer.innerHTML = \"\\n      <div class=\\\"feedback success\\\">\\n        \\u2705 Correct! Great job! You can now proceed with your purchase.\\n      </div>\\n    \";\n    setTimeout(function () {\n      unblockPage();\n    }, 2000);\n  } else {\n    feedbackContainer.innerHTML = \"\\n      <div class=\\\"feedback error\\\">\\n        \\u274C Not quite right. Try again!<br>\\n        <small>Hint: \".concat(correctAnswer.substring(0, 2), \"...</small>\\n      </div>\\n    \");\n    answerInput.value = '';\n    answerInput.focus();\n  }\n}\n\n// Display error\nfunction displayError(errorMessage) {\n  var questionContainer = document.getElementById('question-container');\n  questionContainer.innerHTML = \"\\n    <div class=\\\"error\\\">\\n      \\u26A0\\uFE0F Error loading question: \".concat(errorMessage, \"\\n      <br><br>\\n      <button onclick=\\\"location.reload()\\\">Reload Page</button>\\n    </div>\\n  \");\n}\n\n// Initialize on page load\nfunction init() {\n  // Check if this is a checkout page\n  if (isCheckoutPage()) {\n    console.log('Checkout page detected!');\n\n    // Small delay to ensure page is fully loaded\n    setTimeout(function () {\n      showQuizModal();\n    }, 1000);\n  }\n}\n\n// Run when page loads\nif (document.readyState === 'loading') {\n  document.addEventListener('DOMContentLoaded', init);\n} else {\n  init();\n}\n\n// Also watch for URL changes (for SPAs)\nvar lastUrl = location.href;\nnew MutationObserver(function () {\n  var currentUrl = location.href;\n  if (currentUrl !== lastUrl) {\n    lastUrl = currentUrl;\n    quizShown = false;\n    quizCompleted = false;\n    init();\n  }\n}).observe(document, {\n  subtree: true,\n  childList: true\n});\n\n//# sourceURL=webpack:///./src/content/quiz/controller.js?\n}");

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
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/content/index.js");
/******/ 	
/******/ })()
;