/******/ (() => { // webpackBootstrap
/*!***********************************!*\
  !*** ./src/options/controller.js ***!
  \***********************************/
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
// Options page JavaScript

// Load saved settings
document.addEventListener('DOMContentLoaded', loadSettings);

// Form submit handler
document.getElementById('settings-form').addEventListener('submit', saveSettings);

// Reset button handler
document.getElementById('reset-btn').addEventListener('click', resetToDefaults);

// Load settings from storage
function loadSettings() {
  return _loadSettings.apply(this, arguments);
} // Save settings to storage
function _loadSettings() {
  _loadSettings = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
    var settings, _t;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          _context.p = 0;
          _context.n = 1;
          return chrome.storage.sync.get({
            apiKey: '',
            model: 'openai/gpt-3.5-turbo',
            questionType: 'general',
            difficulty: 'medium',
            customPrompt: ''
          });
        case 1:
          settings = _context.v;
          // Populate form fields
          document.getElementById('apiKey').value = settings.apiKey;
          document.getElementById('model').value = settings.model;
          document.getElementById('questionType').value = settings.questionType;
          document.getElementById('difficulty').value = settings.difficulty;
          document.getElementById('customPrompt').value = settings.customPrompt;
          _context.n = 3;
          break;
        case 2:
          _context.p = 2;
          _t = _context.v;
          showStatus('Error loading settings: ' + _t.message, 'error');
        case 3:
          return _context.a(2);
      }
    }, _callee, null, [[0, 2]]);
  }));
  return _loadSettings.apply(this, arguments);
}
function saveSettings(_x) {
  return _saveSettings.apply(this, arguments);
} // Reset to default settings
function _saveSettings() {
  _saveSettings = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(e) {
    var apiKey, model, questionType, difficulty, customPrompt, _t2;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          e.preventDefault();
          apiKey = document.getElementById('apiKey').value.trim();
          model = document.getElementById('model').value;
          questionType = document.getElementById('questionType').value;
          difficulty = document.getElementById('difficulty').value;
          customPrompt = document.getElementById('customPrompt').value.trim(); // Validate API key
          if (apiKey) {
            _context2.n = 1;
            break;
          }
          showStatus('Please enter your OpenRouter API key', 'error');
          return _context2.a(2);
        case 1:
          if (apiKey.startsWith('sk-or-')) {
            _context2.n = 2;
            break;
          }
          showStatus('Warning: API key should start with "sk-or-"', 'error');
          return _context2.a(2);
        case 2:
          _context2.p = 2;
          _context2.n = 3;
          return chrome.storage.sync.set({
            apiKey: apiKey,
            model: model,
            questionType: questionType,
            difficulty: difficulty,
            customPrompt: customPrompt
          });
        case 3:
          showStatus('Settings saved successfully!', 'success');

          // Auto-hide success message after 3 seconds
          setTimeout(function () {
            hideStatus();
          }, 3000);
          _context2.n = 5;
          break;
        case 4:
          _context2.p = 4;
          _t2 = _context2.v;
          showStatus('Error saving settings: ' + _t2.message, 'error');
        case 5:
          return _context2.a(2);
      }
    }, _callee2, null, [[2, 4]]);
  }));
  return _saveSettings.apply(this, arguments);
}
function resetToDefaults() {
  return _resetToDefaults.apply(this, arguments);
} // Show status message
function _resetToDefaults() {
  _resetToDefaults = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
    var _t3;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          if (confirm('Are you sure you want to reset all settings to defaults? Your API key will be cleared.')) {
            _context3.n = 1;
            break;
          }
          return _context3.a(2);
        case 1:
          _context3.p = 1;
          _context3.n = 2;
          return chrome.storage.sync.set({
            apiKey: '',
            model: 'openai/gpt-3.5-turbo',
            questionType: 'general',
            difficulty: 'medium',
            customPrompt: ''
          });
        case 2:
          // Reload form
          loadSettings();
          showStatus('Settings reset to defaults', 'success');
          setTimeout(function () {
            hideStatus();
          }, 3000);
          _context3.n = 4;
          break;
        case 3:
          _context3.p = 3;
          _t3 = _context3.v;
          showStatus('Error resetting settings: ' + _t3.message, 'error');
        case 4:
          return _context3.a(2);
      }
    }, _callee3, null, [[1, 3]]);
  }));
  return _resetToDefaults.apply(this, arguments);
}
function showStatus(message, type) {
  var statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = "status-message ".concat(type);
  statusEl.style.display = 'block';
}

// Hide status message
function hideStatus() {
  var statusEl = document.getElementById('status');
  statusEl.style.display = 'none';
}

// Add real-time validation for API key
document.getElementById('apiKey').addEventListener('input', function (e) {
  var value = e.target.value;
  if (value && !value.startsWith('sk-or-')) {
    e.target.style.borderColor = '#dc3545';
  } else {
    e.target.style.borderColor = '#e0e0e0';
  }
});
/******/ })()
;
//# sourceMappingURL=options.bundle.js.map