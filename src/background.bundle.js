/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/background/api.js":
/*!*******************************!*\
  !*** ./src/background/api.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   handleMessages: () => (/* binding */ handleMessages)\n/* harmony export */ });\n/* harmony import */ var _question_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./question.js */ \"./src/background/question.js\");\n\nfunction handleMessages(request, sender, sendResponse) {\n  if (request.action === 'getQuestion') {\n    (0,_question_js__WEBPACK_IMPORTED_MODULE_0__.generateQuestion)(request.settings).then(function (result) {\n      return sendResponse(result);\n    })[\"catch\"](function (error) {\n      return sendResponse({\n        error: error.message\n      });\n    });\n    return true;\n  }\n}\n\n//# sourceURL=webpack:///./src/background/api.js?\n}");

/***/ }),

/***/ "./src/background/index.js":
/*!*********************************!*\
  !*** ./src/background/index.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./api.js */ \"./src/background/api.js\");\n/* harmony import */ var _question_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./question.js */ \"./src/background/question.js\");\n\n\nchrome.runtime.onMessage.addListener(_api_js__WEBPACK_IMPORTED_MODULE_0__.handleMessages);\n\n//# sourceURL=webpack:///./src/background/index.js?\n}");

/***/ }),

/***/ "./src/background/prompt.js":
/*!**********************************!*\
  !*** ./src/background/prompt.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   buildPrompt: () => (/* binding */ buildPrompt)\n/* harmony export */ });\nfunction buildPrompt(settings) {\n  var questionType = settings.questionType,\n    difficulty = settings.difficulty,\n    customPrompt = settings.customPrompt;\n  if (customPrompt !== null && customPrompt !== void 0 && customPrompt.trim()) {\n    return \"\".concat(customPrompt, \"\\n\\nGenerate one question at \").concat(difficulty, \" difficulty. Return as JSON: {\\\"question\\\": \\\"...\\\", \\\"answer\\\": \\\"...\\\"}\");\n  }\n  var basePrompt = {\n    'math': 'Generate a math problem',\n    'science': 'Generate a science question (biology, chemistry, or physics)',\n    'history': 'Generate a history question',\n    'geography': 'Generate a geography question',\n    'language': 'Generate a vocabulary or grammar question',\n    'trivia': 'Generate a fun trivia question',\n    'general': 'Generate a general knowledge question'\n  }[questionType] || 'Generate a general knowledge question';\n  return \"\".concat(basePrompt, \" at \").concat(difficulty, \" difficulty. The answer should be 1-3 words. Return as JSON: {\\\"question\\\": \\\"...\\\", \\\"answer\\\": \\\"...\\\"}\");\n}\n\n//# sourceURL=webpack:///./src/background/prompt.js?\n}");

/***/ }),

/***/ "./src/background/question.js":
/*!************************************!*\
  !*** ./src/background/question.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   generateQuestion: () => (/* binding */ generateQuestion)\n/* harmony export */ });\n/* harmony import */ var _prompt_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./prompt.js */ \"./src/background/prompt.js\");\nfunction _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = \"function\" == typeof Symbol ? Symbol : {}, n = r.iterator || \"@@iterator\", o = r.toStringTag || \"@@toStringTag\"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, \"_invoke\", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError(\"Generator is already running\"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = \"next\"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError(\"iterator result is not an object\"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i[\"return\"]) && t.call(i), c < 2 && (u = TypeError(\"The iterator does not provide a '\" + o + \"' method\"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, \"GeneratorFunction\")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, \"constructor\", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, \"constructor\", GeneratorFunction), GeneratorFunction.displayName = \"GeneratorFunction\", _regeneratorDefine2(GeneratorFunctionPrototype, o, \"GeneratorFunction\"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, \"Generator\"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, \"toString\", function () { return \"[object Generator]\"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }\nfunction _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, \"\", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o(\"next\", 0), o(\"throw\", 1), o(\"return\", 2)); }, _regeneratorDefine2(e, r, n, t); }\nfunction asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }\nfunction _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, \"next\", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, \"throw\", n); } _next(void 0); }); }; }\n\nfunction generateQuestion(_x) {\n  return _generateQuestion.apply(this, arguments);\n}\nfunction _generateQuestion() {\n  _generateQuestion = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(settings) {\n    var apiKey, prompt, response, _errorData$error, errorData, data, content, _t, _t2;\n    return _regenerator().w(function (_context) {\n      while (1) switch (_context.p = _context.n) {\n        case 0:\n          _context.p = 0;\n          apiKey = \"MISSING_ENV_VAR\".API_KEY;\n          if (apiKey) {\n            _context.n = 1;\n            break;\n          }\n          throw new Error('API key not configured');\n        case 1:\n          prompt = (0,_prompt_js__WEBPACK_IMPORTED_MODULE_0__.buildPrompt)(settings);\n          _context.n = 2;\n          return fetch('https://openrouter.ai/api/v1/chat/completions', {\n            method: 'POST',\n            headers: {\n              'Authorization': \"Bearer \".concat(apiKey),\n              'Content-Type': 'application/json',\n              'HTTP-Referer': chrome.runtime.getURL(''),\n              'X-Title': 'Study Checkout Extension'\n            },\n            body: JSON.stringify({\n              model: settings.model || 'openai/gpt-3.5-turbo',\n              messages: [{\n                role: 'system',\n                content: 'You are a helpful quiz generator...'\n              }, {\n                role: 'user',\n                content: prompt\n              }],\n              temperature: 0.7,\n              max_tokens: 200\n            })\n          });\n        case 2:\n          response = _context.v;\n          if (response.ok) {\n            _context.n = 4;\n            break;\n          }\n          _context.n = 3;\n          return response.json();\n        case 3:\n          errorData = _context.v;\n          throw new Error(\"API error: \".concat(((_errorData$error = errorData.error) === null || _errorData$error === void 0 ? void 0 : _errorData$error.message) || response.statusText));\n        case 4:\n          _context.n = 5;\n          return response.json();\n        case 5:\n          data = _context.v;\n          content = data.choices[0].message.content;\n          _context.p = 6;\n          return _context.a(2, JSON.parse(content));\n        case 7:\n          _context.p = 7;\n          _t = _context.v;\n          return _context.a(2, parseQuestionFromText(content));\n        case 8:\n          _context.p = 8;\n          _t2 = _context.v;\n          console.error('Question generation error:', _t2);\n          throw _t2;\n        case 9:\n          return _context.a(2);\n      }\n    }, _callee, null, [[6, 7], [0, 8]]);\n  }));\n  return _generateQuestion.apply(this, arguments);\n}\nfunction parseQuestionFromText(text) {\n  var _questionMatch$, _answerMatch$;\n  var questionMatch = text.match(/[Qq]uestion[:\\s]+([^]+?)(?=[Aa]nswer|$)/);\n  var answerMatch = text.match(/[Aa]nswer[:\\s]+([^]+?)$/);\n  return {\n    question: (questionMatch === null || questionMatch === void 0 || (_questionMatch$ = questionMatch[1]) === null || _questionMatch$ === void 0 ? void 0 : _questionMatch$.trim()) || text.substring(0, 200),\n    answer: (answerMatch === null || answerMatch === void 0 || (_answerMatch$ = answerMatch[1]) === null || _answerMatch$ === void 0 ? void 0 : _answerMatch$.trim()) || 'Unable to parse answer'\n  };\n}\n\n//# sourceURL=webpack:///./src/background/question.js?\n}");

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
/******/ 	var __webpack_exports__ = __webpack_require__("./src/background/index.js");
/******/ 	
/******/ })()
;