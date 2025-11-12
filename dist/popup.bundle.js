/******/ (() => { // webpackBootstrap
/*!*********************************!*\
  !*** ./src/popup/controller.js ***!
  \*********************************/
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
// Popup JavaScript

document.addEventListener('DOMContentLoaded', checkConfiguration);

// Open settings page
document.getElementById('settings-btn').addEventListener('click', function () {
  chrome.runtime.openOptionsPage();
});

// Test quiz on current page
document.getElementById('test-btn').addEventListener('click', testOnCurrentPage);

// Check if API key is configured
function checkConfiguration() {
  return _checkConfiguration.apply(this, arguments);
} // Test quiz on current page
function _checkConfiguration() {
  _checkConfiguration = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
    var statusDisplay, apiKey;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          statusDisplay = document.getElementById('status-display');
          console.log('API Key:', "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");
          try {
            apiKey = "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";
            if (apiKey && apiKey.trim()) {
              statusDisplay.textContent = '✅ Extension is configured and ready!';
              statusDisplay.className = 'status configured';
            } else {
              statusDisplay.textContent = '⚠️ Please configure your API key in settings';
              statusDisplay.className = 'status not-configured';
            }
          } catch (error) {
            statusDisplay.textContent = '❌ Error checking configuration';
            statusDisplay.className = 'status not-configured';
          }
        case 1:
          return _context.a(2);
      }
    }, _callee);
  }));
  return _checkConfiguration.apply(this, arguments);
}
function testOnCurrentPage() {
  return _testOnCurrentPage.apply(this, arguments);
}
function _testOnCurrentPage() {
  _testOnCurrentPage = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
    var _yield$chrome$tabs$qu, _yield$chrome$tabs$qu2, tab, _t;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          _context2.p = 0;
          _context2.n = 1;
          return chrome.tabs.query({
            active: true,
            currentWindow: true
          });
        case 1:
          _yield$chrome$tabs$qu = _context2.v;
          _yield$chrome$tabs$qu2 = _slicedToArray(_yield$chrome$tabs$qu, 1);
          tab = _yield$chrome$tabs$qu2[0];
          _context2.n = 2;
          return chrome.scripting.executeScript({
            target: {
              tabId: tab.id
            },
            files: ['content.js']
          });
        case 2:
          _context2.n = 3;
          return chrome.scripting.insertCSS({
            target: {
              tabId: tab.id
            },
            files: ['quiz-modal.css']
          });
        case 3:
          _context2.n = 4;
          return chrome.tabs.sendMessage(tab.id, {
            action: 'showQuiz'
          });
        case 4:
          window.close();
          _context2.n = 6;
          break;
        case 5:
          _context2.p = 5;
          _t = _context2.v;
          alert('Error testing quiz: ' + _t.message);
        case 6:
          return _context2.a(2);
      }
    }, _callee2, null, [[0, 5]]);
  }));
  return _testOnCurrentPage.apply(this, arguments);
}
/******/ })()
;
//# sourceMappingURL=popup.bundle.js.map