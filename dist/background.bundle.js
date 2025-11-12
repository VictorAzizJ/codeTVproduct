var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/@openrouter/sdk/esm/lib/url.js
var hasOwn = Object.prototype.hasOwnProperty;
function pathToFunc(pathPattern, options) {
  const paramRE = /\{([a-zA-Z0-9_][a-zA-Z0-9_-]*?)\}/g;
  return function buildURLPath(params = {}) {
    return pathPattern.replace(paramRE, function(_, placeholder) {
      if (!hasOwn.call(params, placeholder)) {
        throw new Error(`Parameter '${placeholder}' is required`);
      }
      const value = params[placeholder];
      if (typeof value !== "string" && typeof value !== "number") {
        throw new Error(`Parameter '${placeholder}' must be a string or number`);
      }
      return (options == null ? void 0 : options.charEncoding) === "percent" ? encodeURIComponent(`${value}`) : `${value}`;
    });
  };
}

// node_modules/@openrouter/sdk/esm/lib/config.js
var ServerProduction = "production";
var ServerList = {
  [ServerProduction]: "https://openrouter.ai/api/v1"
};
function serverURLFromOptions(options) {
  let serverURL = options.serverURL;
  const params = {};
  if (!serverURL) {
    const server = options.server ?? ServerProduction;
    serverURL = ServerList[server] || "";
  }
  const u = pathToFunc(serverURL)(params);
  return new URL(u);
}
var SDK_METADATA = {
  language: "typescript",
  openapiDocVersion: "1.0.0",
  sdkVersion: "0.1.10",
  genVersion: "2.748.4",
  userAgent: "speakeasy-sdk/typescript 0.1.10 2.748.4 1.0.0 @openrouter/sdk"
};

// node_modules/@openrouter/sdk/esm/lib/http.js
var DEFAULT_FETCHER = (input, init) => {
  if (init == null) {
    return fetch(input);
  } else {
    return fetch(input, init);
  }
};
var HTTPClient = class _HTTPClient {
  constructor(options = {}) {
    this.options = options;
    this.requestHooks = [];
    this.requestErrorHooks = [];
    this.responseHooks = [];
    this.fetcher = options.fetcher || DEFAULT_FETCHER;
  }
  async request(request) {
    let req = request;
    for (const hook of this.requestHooks) {
      const nextRequest = await hook(req);
      if (nextRequest) {
        req = nextRequest;
      }
    }
    try {
      const res = await this.fetcher(req);
      for (const hook of this.responseHooks) {
        await hook(res, req);
      }
      return res;
    } catch (err) {
      for (const hook of this.requestErrorHooks) {
        await hook(err, req);
      }
      throw err;
    }
  }
  addHook(...args) {
    if (args[0] === "beforeRequest") {
      this.requestHooks.push(args[1]);
    } else if (args[0] === "requestError") {
      this.requestErrorHooks.push(args[1]);
    } else if (args[0] === "response") {
      this.responseHooks.push(args[1]);
    } else {
      throw new Error(`Invalid hook type: ${args[0]}`);
    }
    return this;
  }
  removeHook(...args) {
    let target;
    if (args[0] === "beforeRequest") {
      target = this.requestHooks;
    } else if (args[0] === "requestError") {
      target = this.requestErrorHooks;
    } else if (args[0] === "response") {
      target = this.responseHooks;
    } else {
      throw new Error(`Invalid hook type: ${args[0]}`);
    }
    const index = target.findIndex((v) => v === args[1]);
    if (index >= 0) {
      target.splice(index, 1);
    }
    return this;
  }
  clone() {
    const child = new _HTTPClient(this.options);
    child.requestHooks = this.requestHooks.slice();
    child.requestErrorHooks = this.requestErrorHooks.slice();
    child.responseHooks = this.responseHooks.slice();
    return child;
  }
};
var mediaParamSeparator = /\s*;\s*/g;
function matchContentType(response, pattern) {
  var _a2;
  if (pattern === "*") {
    return true;
  }
  let contentType = ((_a2 = response.headers.get("content-type")) == null ? void 0 : _a2.trim()) || "application/octet-stream";
  contentType = contentType.toLowerCase();
  const wantParts = pattern.toLowerCase().trim().split(mediaParamSeparator);
  const [wantType = "", ...wantParams] = wantParts;
  if (wantType.split("/").length !== 2) {
    return false;
  }
  const gotParts = contentType.split(mediaParamSeparator);
  const [gotType = "", ...gotParams] = gotParts;
  const [type = "", subtype = ""] = gotType.split("/");
  if (!type || !subtype) {
    return false;
  }
  if (wantType !== "*/*" && gotType !== wantType && `${type}/*` !== wantType && `*/${subtype}` !== wantType) {
    return false;
  }
  if (gotParams.length < wantParams.length) {
    return false;
  }
  const params = new Set(gotParams);
  for (const wantParam of wantParams) {
    if (!params.has(wantParam)) {
      return false;
    }
  }
  return true;
}
var codeRangeRE = new RegExp("^[0-9]xx$", "i");
function matchStatusCode(response, codes) {
  const actual = `${response.status}`;
  const expectedCodes = Array.isArray(codes) ? codes : [codes];
  if (!expectedCodes.length) {
    return false;
  }
  return expectedCodes.some((ec) => {
    const code = `${ec}`;
    if (code === "default") {
      return true;
    }
    if (!codeRangeRE.test(`${code}`)) {
      return code === actual;
    }
    const expectFamily = code.charAt(0);
    if (!expectFamily) {
      throw new Error("Invalid status code range");
    }
    const actualFamily = actual.charAt(0);
    if (!actualFamily) {
      throw new Error(`Invalid response status code: ${actual}`);
    }
    return actualFamily === expectFamily;
  });
}
function matchResponse(response, code, contentTypePattern) {
  return matchStatusCode(response, code) && matchContentType(response, contentTypePattern);
}
function isConnectionError(err) {
  if (typeof err !== "object" || err == null) {
    return false;
  }
  const isBrowserErr = err instanceof TypeError && err.message.toLowerCase().startsWith("failed to fetch");
  const isNodeErr = err instanceof TypeError && err.message.toLowerCase().startsWith("fetch failed");
  const isBunErr = "name" in err && err.name === "ConnectionError";
  const isGenericErr = "code" in err && typeof err.code === "string" && err.code.toLowerCase() === "econnreset";
  return isBrowserErr || isNodeErr || isGenericErr || isBunErr;
}
function isTimeoutError(err) {
  if (typeof err !== "object" || err == null) {
    return false;
  }
  const isNative = "name" in err && err.name === "TimeoutError";
  const isLegacyNative = "code" in err && err.code === 23;
  const isGenericErr = "code" in err && typeof err.code === "string" && err.code.toLowerCase() === "econnaborted";
  return isNative || isLegacyNative || isGenericErr;
}
function isAbortError(err) {
  if (typeof err !== "object" || err == null) {
    return false;
  }
  const isNative = "name" in err && err.name === "AbortError";
  const isLegacyNative = "code" in err && err.code === 20;
  const isGenericErr = "code" in err && typeof err.code === "string" && err.code.toLowerCase() === "econnaborted";
  return isNative || isLegacyNative || isGenericErr;
}

// node_modules/@openrouter/sdk/esm/hooks/registration.js
function initHooks(hooks) {
}

// node_modules/@openrouter/sdk/esm/hooks/hooks.js
var SDKHooks = class {
  constructor() {
    this.sdkInitHooks = [];
    this.beforeCreateRequestHooks = [];
    this.beforeRequestHooks = [];
    this.afterSuccessHooks = [];
    this.afterErrorHooks = [];
    const presetHooks = [];
    for (const hook of presetHooks) {
      if ("sdkInit" in hook) {
        this.registerSDKInitHook(hook);
      }
      if ("beforeCreateRequest" in hook) {
        this.registerBeforeCreateRequestHook(hook);
      }
      if ("beforeRequest" in hook) {
        this.registerBeforeRequestHook(hook);
      }
      if ("afterSuccess" in hook) {
        this.registerAfterSuccessHook(hook);
      }
      if ("afterError" in hook) {
        this.registerAfterErrorHook(hook);
      }
    }
    initHooks(this);
  }
  registerSDKInitHook(hook) {
    this.sdkInitHooks.push(hook);
  }
  registerBeforeCreateRequestHook(hook) {
    this.beforeCreateRequestHooks.push(hook);
  }
  registerBeforeRequestHook(hook) {
    this.beforeRequestHooks.push(hook);
  }
  registerAfterSuccessHook(hook) {
    this.afterSuccessHooks.push(hook);
  }
  registerAfterErrorHook(hook) {
    this.afterErrorHooks.push(hook);
  }
  sdkInit(opts) {
    return this.sdkInitHooks.reduce((opts2, hook) => hook.sdkInit(opts2), opts);
  }
  beforeCreateRequest(hookCtx, input) {
    let inp = input;
    for (const hook of this.beforeCreateRequestHooks) {
      inp = hook.beforeCreateRequest(hookCtx, inp);
    }
    return inp;
  }
  async beforeRequest(hookCtx, request) {
    let req = request;
    for (const hook of this.beforeRequestHooks) {
      req = await hook.beforeRequest(hookCtx, req);
    }
    return req;
  }
  async afterSuccess(hookCtx, response) {
    let res = response;
    for (const hook of this.afterSuccessHooks) {
      res = await hook.afterSuccess(hookCtx, res);
    }
    return res;
  }
  async afterError(hookCtx, response, error2) {
    let res = response;
    let err = error2;
    for (const hook of this.afterErrorHooks) {
      const result = await hook.afterError(hookCtx, res, err);
      res = result.response;
      err = result.error;
    }
    return { response: res, error: err };
  }
};

// node_modules/@openrouter/sdk/esm/models/errors/httpclienterrors.js
var HTTPClientError = class extends Error {
  constructor(message, opts) {
    let msg = message;
    if (opts == null ? void 0 : opts.cause) {
      msg += `: ${opts.cause}`;
    }
    super(msg, opts);
    this.name = "HTTPClientError";
    if (typeof this.cause === "undefined") {
      this.cause = opts == null ? void 0 : opts.cause;
    }
  }
};
var UnexpectedClientError = class extends HTTPClientError {
  constructor() {
    super(...arguments);
    this.name = "UnexpectedClientError";
  }
};
var InvalidRequestError = class extends HTTPClientError {
  constructor() {
    super(...arguments);
    this.name = "InvalidRequestError";
  }
};
var RequestAbortedError = class extends HTTPClientError {
  constructor() {
    super(...arguments);
    this.name = "RequestAbortedError";
  }
};
var RequestTimeoutError = class extends HTTPClientError {
  constructor() {
    super(...arguments);
    this.name = "RequestTimeoutError";
  }
};
var ConnectionError = class extends HTTPClientError {
  constructor() {
    super(...arguments);
    this.name = "ConnectionError";
  }
};

// node_modules/@openrouter/sdk/esm/types/fp.js
function OK(value) {
  return { ok: true, value };
}
function ERR(error2) {
  return { ok: false, error: error2 };
}
async function unwrapAsync(pr) {
  const r = await pr;
  if (!r.ok) {
    throw r.error;
  }
  return r.value;
}

// node_modules/zod/v4/core/core.js
var NEVER = Object.freeze({
  status: "aborted"
});
// @__NO_SIDE_EFFECTS__
function $constructor(name, initializer3, params) {
  function init(inst, def) {
    var _a2;
    Object.defineProperty(inst, "_zod", {
      value: inst._zod ?? {},
      enumerable: false
    });
    (_a2 = inst._zod).traits ?? (_a2.traits = /* @__PURE__ */ new Set());
    inst._zod.traits.add(name);
    initializer3(inst, def);
    for (const k in _.prototype) {
      if (!(k in inst))
        Object.defineProperty(inst, k, { value: _.prototype[k].bind(inst) });
    }
    inst._zod.constr = _;
    inst._zod.def = def;
  }
  const Parent = (params == null ? void 0 : params.Parent) ?? Object;
  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    var _a2;
    const inst = (params == null ? void 0 : params.Parent) ? new Definition() : this;
    init(inst, def);
    (_a2 = inst._zod).deferred ?? (_a2.deferred = []);
    for (const fn of inst._zod.deferred) {
      fn();
    }
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      var _a2, _b;
      if ((params == null ? void 0 : params.Parent) && inst instanceof params.Parent)
        return true;
      return (_b = (_a2 = inst == null ? void 0 : inst._zod) == null ? void 0 : _a2.traits) == null ? void 0 : _b.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
var $brand = Symbol("zod_brand");
var $ZodAsyncError = class extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
};
var $ZodEncodeError = class extends Error {
  constructor(name) {
    super(`Encountered unidirectional transform during encode: ${name}`);
    this.name = "ZodEncodeError";
  }
};
var globalConfig = {};
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}

// node_modules/zod/v4/core/util.js
var util_exports = {};
__export(util_exports, {
  BIGINT_FORMAT_RANGES: () => BIGINT_FORMAT_RANGES,
  Class: () => Class,
  NUMBER_FORMAT_RANGES: () => NUMBER_FORMAT_RANGES,
  aborted: () => aborted,
  allowsEval: () => allowsEval,
  assert: () => assert,
  assertEqual: () => assertEqual,
  assertIs: () => assertIs,
  assertNever: () => assertNever,
  assertNotEqual: () => assertNotEqual,
  assignProp: () => assignProp,
  base64ToUint8Array: () => base64ToUint8Array,
  base64urlToUint8Array: () => base64urlToUint8Array,
  cached: () => cached,
  captureStackTrace: () => captureStackTrace,
  cleanEnum: () => cleanEnum,
  cleanRegex: () => cleanRegex,
  clone: () => clone,
  cloneDef: () => cloneDef,
  createTransparentProxy: () => createTransparentProxy,
  defineLazy: () => defineLazy,
  esc: () => esc,
  escapeRegex: () => escapeRegex,
  extend: () => extend,
  finalizeIssue: () => finalizeIssue,
  floatSafeRemainder: () => floatSafeRemainder,
  getElementAtPath: () => getElementAtPath,
  getEnumValues: () => getEnumValues,
  getLengthableOrigin: () => getLengthableOrigin,
  getParsedType: () => getParsedType,
  getSizableOrigin: () => getSizableOrigin,
  hexToUint8Array: () => hexToUint8Array,
  isObject: () => isObject,
  isPlainObject: () => isPlainObject,
  issue: () => issue,
  joinValues: () => joinValues,
  jsonStringifyReplacer: () => jsonStringifyReplacer,
  merge: () => merge,
  mergeDefs: () => mergeDefs,
  normalizeParams: () => normalizeParams,
  nullish: () => nullish,
  numKeys: () => numKeys,
  objectClone: () => objectClone,
  omit: () => omit,
  optionalKeys: () => optionalKeys,
  partial: () => partial,
  pick: () => pick,
  prefixIssues: () => prefixIssues,
  primitiveTypes: () => primitiveTypes,
  promiseAllObject: () => promiseAllObject,
  propertyKeyTypes: () => propertyKeyTypes,
  randomString: () => randomString,
  required: () => required,
  safeExtend: () => safeExtend,
  shallowClone: () => shallowClone,
  stringifyPrimitive: () => stringifyPrimitive,
  uint8ArrayToBase64: () => uint8ArrayToBase64,
  uint8ArrayToBase64url: () => uint8ArrayToBase64url,
  uint8ArrayToHex: () => uint8ArrayToHex,
  unwrapMessage: () => unwrapMessage
});
function assertEqual(val) {
  return val;
}
function assertNotEqual(val) {
  return val;
}
function assertIs(_arg) {
}
function assertNever(_x) {
  throw new Error();
}
function assert(_) {
}
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function joinValues(array2, separator = "|") {
  return array2.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
function cached(getter) {
  const set = false;
  return {
    get value() {
      if (!set) {
        const value = getter();
        Object.defineProperty(this, "value", { value });
        return value;
      }
      throw new Error("cached value already set");
    }
  };
}
function nullish(input) {
  return input === null || input === void 0;
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepString = step.toString();
  let stepDecCount = (stepString.split(".")[1] || "").length;
  if (stepDecCount === 0 && /\d?e-\d?/.test(stepString)) {
    const match2 = stepString.match(/\d?e-(\d?)/);
    if (match2 == null ? void 0 : match2[1]) {
      stepDecCount = Number.parseInt(match2[1]);
    }
  }
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var EVALUATING = Symbol("evaluating");
function defineLazy(object2, key, getter) {
  let value = void 0;
  Object.defineProperty(object2, key, {
    get() {
      if (value === EVALUATING) {
        return void 0;
      }
      if (value === void 0) {
        value = EVALUATING;
        value = getter();
      }
      return value;
    },
    set(v) {
      Object.defineProperty(object2, key, {
        value: v
        // configurable: true,
      });
    },
    configurable: true
  });
}
function objectClone(obj) {
  return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function mergeDefs(...defs) {
  const mergedDescriptors = {};
  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }
  return Object.defineProperties({}, mergedDescriptors);
}
function cloneDef(schema) {
  return mergeDefs(schema._zod.def);
}
function getElementAtPath(obj, path) {
  if (!path)
    return obj;
  return path.reduce((acc, key) => acc == null ? void 0 : acc[key], obj);
}
function promiseAllObject(promisesObj) {
  const keys = Object.keys(promisesObj);
  const promises = keys.map((key) => promisesObj[key]);
  return Promise.all(promises).then((results) => {
    const resolvedObj = {};
    for (let i = 0; i < keys.length; i++) {
      resolvedObj[keys[i]] = results[i];
    }
    return resolvedObj;
  });
}
function randomString(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let str = "";
  for (let i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}
function esc(str) {
  return JSON.stringify(str);
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {
};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = cached(() => {
  var _a2;
  if (typeof navigator !== "undefined" && ((_a2 = navigator == null ? void 0 : navigator.userAgent) == null ? void 0 : _a2.includes("Cloudflare"))) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === void 0)
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function shallowClone(o) {
  if (isPlainObject(o))
    return { ...o };
  if (Array.isArray(o))
    return [...o];
  return o;
}
function numKeys(data) {
  let keyCount = 0;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      keyCount++;
    }
  }
  return keyCount;
}
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return "undefined";
    case "string":
      return "string";
    case "number":
      return Number.isNaN(data) ? "nan" : "number";
    case "boolean":
      return "boolean";
    case "function":
      return "function";
    case "bigint":
      return "bigint";
    case "symbol":
      return "symbol";
    case "object":
      if (Array.isArray(data)) {
        return "array";
      }
      if (data === null) {
        return "null";
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return "promise";
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return "map";
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return "set";
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return "date";
      }
      if (typeof File !== "undefined" && data instanceof File) {
        return "file";
      }
      return "object";
    default:
      throw new Error(`Unknown data type: ${t}`);
  }
};
var propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
var primitiveTypes = /* @__PURE__ */ new Set(["string", "number", "bigint", "boolean", "symbol", "undefined"]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || (params == null ? void 0 : params.parent))
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if ((params == null ? void 0 : params.message) !== void 0) {
    if ((params == null ? void 0 : params.error) !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function createTransparentProxy(getter) {
  let target;
  return new Proxy({}, {
    get(_, prop, receiver) {
      target ?? (target = getter());
      return Reflect.get(target, prop, receiver);
    },
    set(_, prop, value, receiver) {
      target ?? (target = getter());
      return Reflect.set(target, prop, value, receiver);
    },
    has(_, prop) {
      target ?? (target = getter());
      return Reflect.has(target, prop);
    },
    deleteProperty(_, prop) {
      target ?? (target = getter());
      return Reflect.deleteProperty(target, prop);
    },
    ownKeys(_) {
      target ?? (target = getter());
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(_, prop) {
      target ?? (target = getter());
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    defineProperty(_, prop, descriptor) {
      target ?? (target = getter());
      return Reflect.defineProperty(target, prop, descriptor);
    }
  });
}
function stringifyPrimitive(value) {
  if (typeof value === "bigint")
    return value.toString() + "n";
  if (typeof value === "string")
    return `"${value}"`;
  return `${value}`;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
  });
}
var NUMBER_FORMAT_RANGES = {
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
var BIGINT_FORMAT_RANGES = {
  int64: [/* @__PURE__ */ BigInt("-9223372036854775808"), /* @__PURE__ */ BigInt("9223372036854775807")],
  uint64: [/* @__PURE__ */ BigInt(0), /* @__PURE__ */ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
  const currDef = schema._zod.def;
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const newShape = {};
      for (const key in mask) {
        if (!(key in currDef.shape)) {
          throw new Error(`Unrecognized key: "${key}"`);
        }
        if (!mask[key])
          continue;
        newShape[key] = currDef.shape[key];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
    checks: []
  });
  return clone(schema, def);
}
function omit(schema, mask) {
  const currDef = schema._zod.def;
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const newShape = { ...schema._zod.def.shape };
      for (const key in mask) {
        if (!(key in currDef.shape)) {
          throw new Error(`Unrecognized key: "${key}"`);
        }
        if (!mask[key])
          continue;
        delete newShape[key];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
    checks: []
  });
  return clone(schema, def);
}
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const checks = schema._zod.def.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error("Object schemas containing refinements cannot be extended. Use `.safeExtend()` instead.");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    checks: []
  });
  return clone(schema, def);
}
function safeExtend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to safeExtend: expected a plain object");
  }
  const def = {
    ...schema._zod.def,
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    checks: schema._zod.def.checks
  };
  return clone(schema, def);
}
function merge(a, b) {
  const def = mergeDefs(a._zod.def, {
    get shape() {
      const _shape = { ...a._zod.def.shape, ...b._zod.def.shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    get catchall() {
      return b._zod.def.catchall;
    },
    checks: []
    // delete existing checks
  });
  return clone(a, def);
}
function partial(Class2, schema, mask) {
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const oldShape = schema._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key in mask) {
          if (!(key in oldShape)) {
            throw new Error(`Unrecognized key: "${key}"`);
          }
          if (!mask[key])
            continue;
          shape[key] = Class2 ? new Class2({
            type: "optional",
            innerType: oldShape[key]
          }) : oldShape[key];
        }
      } else {
        for (const key in oldShape) {
          shape[key] = Class2 ? new Class2({
            type: "optional",
            innerType: oldShape[key]
          }) : oldShape[key];
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    },
    checks: []
  });
  return clone(schema, def);
}
function required(Class2, schema, mask) {
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const oldShape = schema._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key in mask) {
          if (!(key in shape)) {
            throw new Error(`Unrecognized key: "${key}"`);
          }
          if (!mask[key])
            continue;
          shape[key] = new Class2({
            type: "nonoptional",
            innerType: oldShape[key]
          });
        }
      } else {
        for (const key in oldShape) {
          shape[key] = new Class2({
            type: "nonoptional",
            innerType: oldShape[key]
          });
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    },
    checks: []
  });
  return clone(schema, def);
}
function aborted(x, startIndex = 0) {
  var _a2;
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (((_a2 = x.issues[i]) == null ? void 0 : _a2.continue) !== true) {
      return true;
    }
  }
  return false;
}
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    var _a2;
    (_a2 = iss).path ?? (_a2.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message == null ? void 0 : message.message;
}
function finalizeIssue(iss, ctx, config2) {
  var _a2, _b, _c, _d, _e, _f;
  const full = { ...iss, path: iss.path ?? [] };
  if (!iss.message) {
    const message = unwrapMessage((_c = (_b = (_a2 = iss.inst) == null ? void 0 : _a2._zod.def) == null ? void 0 : _b.error) == null ? void 0 : _c.call(_b, iss)) ?? unwrapMessage((_d = ctx == null ? void 0 : ctx.error) == null ? void 0 : _d.call(ctx, iss)) ?? unwrapMessage((_e = config2.customError) == null ? void 0 : _e.call(config2, iss)) ?? unwrapMessage((_f = config2.localeError) == null ? void 0 : _f.call(config2, iss)) ?? "Invalid input";
    full.message = message;
  }
  delete full.inst;
  delete full.continue;
  if (!(ctx == null ? void 0 : ctx.reportInput)) {
    delete full.input;
  }
  return full;
}
function getSizableOrigin(input) {
  if (input instanceof Set)
    return "set";
  if (input instanceof Map)
    return "map";
  if (input instanceof File)
    return "file";
  return "unknown";
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}
function cleanEnum(obj) {
  return Object.entries(obj).filter(([k, _]) => {
    return Number.isNaN(Number.parseInt(k, 10));
  }).map((el) => el[1]);
}
function base64ToUint8Array(base642) {
  const binaryString = atob(base642);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
function uint8ArrayToBase64(bytes) {
  let binaryString = "";
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryString);
}
function base64urlToUint8Array(base64url2) {
  const base642 = base64url2.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - base642.length % 4) % 4);
  return base64ToUint8Array(base642 + padding);
}
function uint8ArrayToBase64url(bytes) {
  return uint8ArrayToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function hexToUint8Array(hex) {
  const cleanHex = hex.replace(/^0x/, "");
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}
function uint8ArrayToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var Class = class {
  constructor(..._args) {
  }
};

// node_modules/zod/v4/core/errors.js
var initializer = (inst, def) => {
  inst.name = "$ZodError";
  Object.defineProperty(inst, "_zod", {
    value: inst._zod,
    enumerable: false
  });
  Object.defineProperty(inst, "issues", {
    value: def,
    enumerable: false
  });
  inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
  Object.defineProperty(inst, "toString", {
    value: () => inst.message,
    enumerable: false
  });
};
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, { Parent: Error });
function flattenError(error2, mapper = (issue2) => issue2.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error2.issues) {
    if (sub.path.length > 0) {
      fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
      fieldErrors[sub.path[0]].push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error2, mapper = (issue2) => issue2.message) {
  const fieldErrors = { _errors: [] };
  const processError = (error3) => {
    for (const issue2 of error3.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues });
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues });
      } else if (issue2.path.length === 0) {
        fieldErrors._errors.push(mapper(issue2));
      } else {
        let curr = fieldErrors;
        let i = 0;
        while (i < issue2.path.length) {
          const el = issue2.path[i];
          const terminal = i === issue2.path.length - 1;
          if (!terminal) {
            curr[el] = curr[el] || { _errors: [] };
          } else {
            curr[el] = curr[el] || { _errors: [] };
            curr[el]._errors.push(mapper(issue2));
          }
          curr = curr[el];
          i++;
        }
      }
    }
  };
  processError(error2);
  return fieldErrors;
}
function toDotPath(_path) {
  const segs = [];
  const path = _path.map((seg) => typeof seg === "object" ? seg.key : seg);
  for (const seg of path) {
    if (typeof seg === "number")
      segs.push(`[${seg}]`);
    else if (typeof seg === "symbol")
      segs.push(`[${JSON.stringify(String(seg))}]`);
    else if (/[^\w$]/.test(seg))
      segs.push(`[${JSON.stringify(seg)}]`);
    else {
      if (segs.length)
        segs.push(".");
      segs.push(seg);
    }
  }
  return segs.join("");
}
function prettifyError(error2) {
  var _a2;
  const lines = [];
  const issues = [...error2.issues].sort((a, b) => (a.path ?? []).length - (b.path ?? []).length);
  for (const issue2 of issues) {
    lines.push(`\u2716 ${issue2.message}`);
    if ((_a2 = issue2.path) == null ? void 0 : _a2.length)
      lines.push(`  \u2192 at ${toDotPath(issue2.path)}`);
  }
  return lines.join("\n");
}

// node_modules/zod/v4/core/parse.js
var _parse = (_Err) => (schema, value, _ctx, _params) => {
  const ctx = _ctx ? Object.assign(_ctx, { async: false }) : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  if (result.issues.length) {
    const e = new ((_params == null ? void 0 : _params.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, _params == null ? void 0 : _params.callee);
    throw e;
  }
  return result.value;
};
var _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
  const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  if (result.issues.length) {
    const e = new ((params == null ? void 0 : params.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, params == null ? void 0 : params.callee);
    throw e;
  }
  return result.value;
};
var _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  return result.issues.length ? {
    success: false,
    error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
var safeParse = /* @__PURE__ */ _safeParse($ZodRealError);
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? {
    success: false,
    error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
var safeParseAsync = /* @__PURE__ */ _safeParseAsync($ZodRealError);
var _encode = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
  return _parse(_Err)(schema, value, ctx);
};
var _decode = (_Err) => (schema, value, _ctx) => {
  return _parse(_Err)(schema, value, _ctx);
};
var _encodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
  return _parseAsync(_Err)(schema, value, ctx);
};
var _decodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _parseAsync(_Err)(schema, value, _ctx);
};
var _safeEncode = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
  return _safeParse(_Err)(schema, value, ctx);
};
var _safeDecode = (_Err) => (schema, value, _ctx) => {
  return _safeParse(_Err)(schema, value, _ctx);
};
var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
  return _safeParseAsync(_Err)(schema, value, ctx);
};
var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _safeParseAsync(_Err)(schema, value, _ctx);
};

// node_modules/zod/v4/core/regexes.js
var cuid = /^[cC][^\s-]{8,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
var duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
var uuid = (version2) => {
  if (!version2)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version2}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
var email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var _emoji = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
function emoji() {
  return new RegExp(_emoji, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url = /^[A-Za-z0-9_-]*$/;
var hostname = /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/;
var e164 = /^\+(?:[0-9]){6,14}[0-9]$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
var date = /* @__PURE__ */ new RegExp(`^${dateSource}$`);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
function time(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
  const time3 = timeSource({ precision: args.precision });
  const opts = ["Z"];
  if (args.local)
    opts.push("");
  if (args.offset)
    opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
  const timeRegex2 = `${time3}(?:${opts.join("|")})`;
  return new RegExp(`^${dateSource}T(?:${timeRegex2})$`);
}
var string = (params) => {
  const regex = params ? `[\\s\\S]{${(params == null ? void 0 : params.minimum) ?? 0},${(params == null ? void 0 : params.maximum) ?? ""}}` : `[\\s\\S]*`;
  return new RegExp(`^${regex}$`);
};
var bigint = /^-?\d+n?$/;
var integer = /^-?\d+$/;
var number = /^-?\d+(?:\.\d+)?/;
var boolean = /^(?:true|false)$/i;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;

// node_modules/zod/v4/core/checks.js
var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a2;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a2 = inst._zod).onattach ?? (_a2.onattach = []);
});
var numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
var $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
    if (def.value < curr) {
      if (def.inclusive)
        bag.maximum = def.value;
      else
        bag.exclusiveMaximum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
    if (def.value > curr) {
      if (def.inclusive)
        bag.minimum = def.value;
      else
        bag.exclusiveMinimum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    var _a2;
    (_a2 = inst2._zod.bag).multipleOf ?? (_a2.multipleOf = def.value);
  });
  inst._zod.check = (payload) => {
    if (typeof payload.value !== typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    const isMultiple = typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0;
    if (isMultiple)
      return;
    payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  var _a2;
  $ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = (_a2 = def.format) == null ? void 0 : _a2.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = def.format;
    bag.minimum = minimum;
    bag.maximum = maximum;
    if (isInt)
      bag.pattern = integer;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          continue: false,
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        if (input > 0) {
          payload.issues.push({
            input,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input < minimum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_big",
        maximum,
        inst
      });
    }
  };
});
var $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a2;
  $ZodCheck.init(inst, def);
  (_a2 = inst._zod.def).when ?? (_a2.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    if (def.maximum < curr)
      inst2._zod.bag.maximum = def.maximum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a2;
  $ZodCheck.init(inst, def);
  (_a2 = inst._zod.def).when ?? (_a2.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    if (def.minimum > curr)
      inst2._zod.bag.minimum = def.minimum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
  var _a2;
  $ZodCheck.init(inst, def);
  (_a2 = inst._zod.def).when ?? (_a2.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.minimum = def.length;
    bag.maximum = def.length;
    bag.length = def.length;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length === def.length)
      return;
    const origin = getLengthableOrigin(input);
    const tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a2, _b;
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = def.format;
    if (def.pattern) {
      bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
      bag.patterns.add(def.pattern);
    }
  });
  if (def.pattern)
    (_a2 = inst._zod).check ?? (_a2.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {
    });
});
var $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
  $ZodCheck.init(inst, def);
  const escapedRegex = escapeRegex(def.includes);
  const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
  def.pattern = pattern;
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.includes(def.includes, def.position))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.startsWith(def.prefix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.endsWith(def.suffix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});

// node_modules/zod/v4/core/doc.js
var Doc = class {
  constructor(args = []) {
    this.content = [];
    this.indent = 0;
    if (this)
      this.args = args;
  }
  indented(fn) {
    this.indent += 1;
    fn(this);
    this.indent -= 1;
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split("\n").filter((x) => x);
    const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
    const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const args = this == null ? void 0 : this.args;
    const content = (this == null ? void 0 : this.content) ?? [``];
    const lines = [...content.map((x) => `  ${x}`)];
    return new F(...args, lines.join("\n"));
  }
};

// node_modules/zod/v4/core/versions.js
var version = {
  major: 4,
  minor: 1,
  patch: 12
};

// node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a3;
  var _a2;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const checks = [...inst._zod.def.checks ?? []];
  if (inst._zod.traits.has("$ZodCheck")) {
    checks.unshift(inst);
  }
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a2 = inst._zod).deferred ?? (_a2.deferred = []);
    (_a3 = inst._zod.deferred) == null ? void 0 : _a3.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks2, ctx) => {
      let isAborted2 = aborted(payload);
      let asyncResult;
      for (const ch of checks2) {
        if (ch._zod.def.when) {
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted2) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && (ctx == null ? void 0 : ctx.async) === false) {
          throw new $ZodAsyncError();
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            if (!isAborted2)
              isAborted2 = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          if (!isAborted2)
            isAborted2 = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    const handleCanaryResult = (canary, payload, ctx) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx);
      if (checkResult instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return checkResult.then((checkResult2) => inst._zod.parse(checkResult2, ctx));
      }
      return inst._zod.parse(checkResult, ctx);
    };
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary2) => {
            return handleCanaryResult(canary2, payload, ctx);
          });
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return result.then((result2) => runChecks(result2, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
  inst["~standard"] = {
    validate: (value) => {
      var _a4;
      try {
        const r = safeParse(inst, value);
        return r.success ? { value: r.data } : { issues: (_a4 = r.error) == null ? void 0 : _a4.issues };
      } catch (_) {
        return safeParseAsync(inst, value).then((r) => {
          var _a5;
          return r.success ? { value: r.data } : { issues: (_a5 = r.error) == null ? void 0 : _a5.issues };
        });
      }
    },
    vendor: "zod",
    version: 1
  };
});
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  var _a2;
  $ZodType.init(inst, def);
  inst._zod.pattern = [...((_a2 = inst == null ? void 0 : inst._zod.bag) == null ? void 0 : _a2.patterns) ?? []].pop() ?? string(inst._zod.bag);
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_2) {
      }
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  $ZodString.init(inst, def);
});
var $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  $ZodStringFormat.init(inst, def);
});
var $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    };
    const v = versionMap[def.version];
    if (v === void 0)
      throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  $ZodStringFormat.init(inst, def);
});
var $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  $ZodStringFormat.init(inst, def);
});
var $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const trimmed = payload.value.trim();
      const url = new URL(trimmed);
      if (def.hostname) {
        def.hostname.lastIndex = 0;
        if (!def.hostname.test(url.hostname)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid hostname",
            pattern: hostname.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.protocol) {
        def.protocol.lastIndex = 0;
        if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid protocol",
            pattern: def.protocol.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.normalize) {
        payload.value = url.href;
      } else {
        payload.value = trimmed;
      }
      return;
    } catch (_) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  $ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  def.pattern ?? (def.pattern = nanoid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  $ZodStringFormat.init(inst, def);
});
var $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  $ZodStringFormat.init(inst, def);
});
var $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  $ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date);
  $ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration);
  $ZodStringFormat.init(inst, def);
});
var $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  $ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = `ipv4`;
  });
});
var $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = `ipv6`;
  });
  inst._zod.check = (payload) => {
    try {
      new URL(`http://[${payload.value}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  $ZodStringFormat.init(inst, def);
});
var $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    const parts = payload.value.split("/");
    try {
      if (parts.length !== 2)
        throw new Error();
      const [address, prefix] = parts;
      if (!prefix)
        throw new Error();
      const prefixNum = Number(prefix);
      if (`${prefixNum}` !== prefix)
        throw new Error();
      if (prefixNum < 0 || prefixNum > 128)
        throw new Error();
      new URL(`http://[${address}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return true;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
var $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64);
  $ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    inst2._zod.bag.contentEncoding = "base64";
  });
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function isValidBase64URL(data) {
  if (!base64url.test(data))
    return false;
  const base642 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base642.padEnd(Math.ceil(base642.length / 4) * 4, "=");
  return isValidBase64(padded);
}
var $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64url);
  $ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    inst2._zod.bag.contentEncoding = "base64url";
  });
  inst._zod.check = (payload) => {
    if (isValidBase64URL(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  $ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && (parsedHeader == null ? void 0 : parsedHeader.typ) !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
var $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT(payload.value, def.alg))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = inst._zod.bag.pattern ?? number;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : void 0 : void 0;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
var $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def);
  $ZodNumber.init(inst, def);
});
var $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodBigInt = /* @__PURE__ */ $constructor("$ZodBigInt", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = bigint;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = BigInt(payload.value);
      } catch (_) {
      }
    if (typeof payload.value === "bigint")
      return payload;
    payload.issues.push({
      expected: "bigint",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodAny = /* @__PURE__ */ $constructor("$ZodAny", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodDate = /* @__PURE__ */ $constructor("$ZodDate", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce) {
      try {
        payload.value = new Date(payload.value);
      } catch (_err) {
      }
    }
    const input = payload.value;
    const isDate = input instanceof Date;
    const isValidDate = isDate && !Number.isNaN(input.getTime());
    if (isValidDate)
      return payload;
    payload.issues.push({
      expected: "date",
      code: "invalid_type",
      input,
      ...isDate ? { received: "Invalid Date" } : {},
      inst
    });
    return payload;
  };
});
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = Array(input.length);
    const proms = [];
    for (let i = 0; i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleArrayResult(result2, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handlePropertyResult(result, final, key, input) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (result.value === void 0) {
    if (key in input) {
      final.value[key] = void 0;
    }
  } else {
    final.value[key] = result.value;
  }
}
function normalizeDef(def) {
  var _a2, _b, _c, _d;
  const keys = Object.keys(def.shape);
  for (const k of keys) {
    if (!((_d = (_c = (_b = (_a2 = def.shape) == null ? void 0 : _a2[k]) == null ? void 0 : _b._zod) == null ? void 0 : _c.traits) == null ? void 0 : _d.has("$ZodType"))) {
      throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    keys,
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys)
  };
}
function handleCatchall(proms, input, payload, ctx, def, inst) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  for (const key of Object.keys(input)) {
    if (keySet.has(key))
      continue;
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ value: input[key], issues: [] }, ctx);
    if (r instanceof Promise) {
      proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input)));
    } else {
      handlePropertyResult(r, payload, key, input);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  if (!(desc == null ? void 0 : desc.get)) {
    const sh = def.shape;
    Object.defineProperty(def, "shape", {
      get: () => {
        const newSh = { ...sh };
        Object.defineProperty(def, "shape", {
          value: newSh
        });
        return newSh;
      }
    });
  }
  const _normalized = cached(() => normalizeDef(def));
  defineLazy(inst._zod, "propValues", () => {
    const shape = def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        propValues[key] ?? (propValues[key] = /* @__PURE__ */ new Set());
        for (const v of field.values)
          propValues[key].add(v);
      }
    }
    return propValues;
  });
  const isObject2 = isObject;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = {};
    const proms = [];
    const shape = value.shape;
    for (const key of value.keys) {
      const el = shape[key];
      const r = el._zod.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input)));
      } else {
        handlePropertyResult(r, payload, key, input);
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
  };
});
var $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
  $ZodObject.init(inst, def);
  const superParse = inst._zod.parse;
  const _normalized = cached(() => normalizeDef(def));
  const generateFastpass = (shape) => {
    const doc = new Doc(["shape", "payload", "ctx"]);
    const normalized = _normalized.value;
    const parseStr = (key) => {
      const k = esc(key);
      return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
    };
    doc.write(`const input = payload.value;`);
    const ids = /* @__PURE__ */ Object.create(null);
    let counter = 0;
    for (const key of normalized.keys) {
      ids[key] = `key_${counter++}`;
    }
    doc.write(`const newResult = {};`);
    for (const key of normalized.keys) {
      const id = ids[key];
      const k = esc(key);
      doc.write(`const ${id} = ${parseStr(key)};`);
      doc.write(`
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
    }
    doc.write(`payload.value = newResult;`);
    doc.write(`return payload;`);
    const fn = doc.compile();
    return (payload, ctx) => fn(shape, payload, ctx);
  };
  let fastpass;
  const isObject2 = isObject;
  const jit = !globalConfig.jitless;
  const allowsEval2 = allowsEval;
  const fastEnabled = jit && allowsEval2.value;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    if (jit && fastEnabled && (ctx == null ? void 0 : ctx.async) === false && ctx.jitless !== true) {
      if (!fastpass)
        fastpass = generateFastpass(def.shape);
      payload = fastpass(payload, ctx);
      if (!catchall)
        return payload;
      return handleCatchall([], input, payload, ctx, value, inst);
    }
    return superParse(payload, ctx);
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results.filter((r) => !aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0);
  defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
  defineLazy(inst._zod, "values", () => {
    if (def.options.every((o) => o._zod.values)) {
      return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return void 0;
  });
  defineLazy(inst._zod, "pattern", () => {
    if (def.options.every((o) => o._zod.pattern)) {
      const patterns = def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return void 0;
  });
  const single = def.options.length === 1;
  const first = def.options[0]._zod.run;
  inst._zod.parse = (payload, ctx) => {
    if (single) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results2) => {
      return handleUnionResults(results2, payload, inst, ctx);
    });
  };
});
var $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    const left = def.left._zod.run({ value: input, issues: [] }, ctx);
    const right = def.right._zod.run({ value: input, issues: [] }, ctx);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left2, right2]) => {
        return handleIntersectionResults(payload, left2, right2);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  if (left.issues.length) {
    result.issues.push(...left.issues);
  }
  if (right.issues.length) {
    result.issues.push(...right.issues);
  }
  if (aborted(result))
    return result;
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
var $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isPlainObject(input)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    if (def.keyType._zod.values) {
      const values = def.keyType._zod.values;
      payload.value = {};
      for (const key of values) {
        if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
          const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => {
              if (result2.issues.length) {
                payload.issues.push(...prefixIssues(key, result2.issues));
              }
              payload.value[key] = result2.value;
            }));
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[key] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key in input) {
        if (!values.has(key)) {
          unrecognized = unrecognized ?? [];
          unrecognized.push(key);
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized
        });
      }
    } else {
      payload.value = {};
      for (const key of Reflect.ownKeys(input)) {
        if (key === "__proto__")
          continue;
        const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }
        if (keyResult.issues.length) {
          payload.issues.push({
            code: "invalid_key",
            origin: "record",
            issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
            input: key,
            path: [key],
            inst
          });
          payload.value[keyResult.value] = keyResult.value;
          continue;
        }
        const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result2) => {
            if (result2.issues.length) {
              payload.issues.push(...prefixIssues(key, result2.issues));
            }
            payload.value[keyResult.value] = result2.value;
          }));
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key, result.issues));
          }
          payload.value[keyResult.value] = result.value;
        }
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  const valuesSet = new Set(values);
  inst._zod.values = valuesSet;
  inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (valuesSet.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  if (def.values.length === 0) {
    throw new Error("Cannot create literal schema with no valid values");
  }
  inst._zod.values = new Set(def.values);
  inst._zod.pattern = new RegExp(`^(${def.values.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (inst._zod.values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    const _out = def.transform(payload.value, payload);
    if (ctx.async) {
      const output = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output.then((output2) => {
        payload.value = output2;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new $ZodAsyncError();
    }
    payload.value = _out;
    return payload;
  };
});
function handleOptionalResult(result, input) {
  if (result.issues.length && input === void 0) {
    return { issues: [], value: void 0 };
  }
  return result;
}
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  inst._zod.optout = "optional";
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, void 0]) : void 0;
  });
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (def.innerType._zod.optin === "optional") {
      const result = def.innerType._zod.run(payload, ctx);
      if (result instanceof Promise)
        return result.then((r) => handleOptionalResult(r, payload.value));
      return handleOptionalResult(result, payload.value);
    }
    if (payload.value === void 0) {
      return payload;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
  });
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, null]) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleDefaultResult(result2, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === void 0) {
    payload.value = def.defaultValue;
  }
  return payload;
}
var $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => {
    const v = def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleNonOptionalResult(result2, inst));
    }
    return handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === void 0) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
var $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => {
        payload.value = result2.value;
        if (result2.issues.length) {
          payload.value = def.catchValue({
            ...payload,
            error: {
              issues: result2.issues.map((iss) => finalizeIssue(iss, ctx, config()))
            },
            input: payload.value
          });
          payload.issues = [];
        }
        return payload;
      });
    }
    payload.value = result.value;
    if (result.issues.length) {
      payload.value = def.catchValue({
        ...payload,
        error: {
          issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
        },
        input: payload.value
      });
      payload.issues = [];
    }
    return payload;
  };
});
var $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => def.in._zod.values);
  defineLazy(inst._zod, "optin", () => def.in._zod.optin);
  defineLazy(inst._zod, "optout", () => def.out._zod.optout);
  defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right2) => handlePipeResult(right2, def.in, ctx));
      }
      return handlePipeResult(right, def.in, ctx);
    }
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left2) => handlePipeResult(left2, def.out, ctx));
    }
    return handlePipeResult(left, def.out, ctx);
  };
});
function handlePipeResult(left, next, ctx) {
  if (left.issues.length) {
    left.aborted = true;
    return left;
  }
  return next._zod.run({ value: left.value, issues: left.issues }, ctx);
}
var $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  payload.value = Object.freeze(payload.value);
  return payload;
}
var $ZodLazy = /* @__PURE__ */ $constructor("$ZodLazy", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "innerType", () => def.getter());
  defineLazy(inst._zod, "pattern", () => inst._zod.innerType._zod.pattern);
  defineLazy(inst._zod, "propValues", () => inst._zod.innerType._zod.propValues);
  defineLazy(inst._zod, "optin", () => inst._zod.innerType._zod.optin ?? void 0);
  defineLazy(inst._zod, "optout", () => inst._zod.innerType._zod.optout ?? void 0);
  inst._zod.parse = (payload, ctx) => {
    const inner = inst._zod.innerType;
    return inner._zod.run(payload, ctx);
  };
});
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r2) => handleRefineResult(r2, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      // incorporates params.error into issue reporting
      path: [...inst._zod.def.path ?? []],
      // incorporates params.error into issue reporting
      continue: !inst._zod.def.abort
      // params: inst._zod.def.params,
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}

// node_modules/zod/v4/locales/en.js
var parsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "number": {
      return Number.isNaN(data) ? "NaN" : "number";
    }
    case "object": {
      if (Array.isArray(data)) {
        return "array";
      }
      if (data === null) {
        return "null";
      }
      if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
        return data.constructor.name;
      }
    }
  }
  return t;
};
var error = () => {
  const Sizable = {
    string: { unit: "characters", verb: "to have" },
    file: { unit: "bytes", verb: "to have" },
    array: { unit: "items", verb: "to have" },
    set: { unit: "items", verb: "to have" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const Nouns = {
    regex: "input",
    email: "email address",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datetime",
    date: "ISO date",
    time: "ISO time",
    duration: "ISO duration",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    base64: "base64-encoded string",
    base64url: "base64url-encoded string",
    json_string: "JSON string",
    e164: "E.164 number",
    jwt: "JWT",
    template_literal: "input"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return `Invalid input: expected ${issue2.expected}, received ${parsedType(issue2.input)}`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Invalid input: expected ${stringifyPrimitive(issue2.values[0])}`;
        return `Invalid option: expected one of ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Too big: expected ${issue2.origin ?? "value"} to have ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elements"}`;
        return `Too big: expected ${issue2.origin ?? "value"} to be ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Too small: expected ${issue2.origin} to have ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Too small: expected ${issue2.origin} to be ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Invalid string: must start with "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Invalid string: must end with "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Invalid string: must include "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Invalid string: must match pattern ${_issue.pattern}`;
        return `Invalid ${Nouns[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Invalid number: must be a multiple of ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Unrecognized key${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Invalid key in ${issue2.origin}`;
      case "invalid_union":
        return "Invalid input";
      case "invalid_element":
        return `Invalid value in ${issue2.origin}`;
      default:
        return `Invalid input`;
    }
  };
};
function en_default() {
  return {
    localeError: error()
  };
}

// node_modules/zod/v4/core/registries.js
var $output = Symbol("ZodOutput");
var $input = Symbol("ZodInput");
var $ZodRegistry = class {
  constructor() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
  }
  add(schema, ..._meta) {
    const meta = _meta[0];
    this._map.set(schema, meta);
    if (meta && typeof meta === "object" && "id" in meta) {
      if (this._idmap.has(meta.id)) {
        throw new Error(`ID ${meta.id} already exists in the registry`);
      }
      this._idmap.set(meta.id, schema);
    }
    return this;
  }
  clear() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
    return this;
  }
  remove(schema) {
    const meta = this._map.get(schema);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.delete(meta.id);
    }
    this._map.delete(schema);
    return this;
  }
  get(schema) {
    const p = schema._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      const f = { ...pm, ...this._map.get(schema) };
      return Object.keys(f).length ? f : void 0;
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
};
function registry() {
  return new $ZodRegistry();
}
var globalRegistry = /* @__PURE__ */ registry();

// node_modules/zod/v4/core/api.js
function _string(Class2, params) {
  return new Class2({
    type: "string",
    ...normalizeParams(params)
  });
}
function _coercedString(Class2, params) {
  return new Class2({
    type: "string",
    coerce: true,
    ...normalizeParams(params)
  });
}
function _email(Class2, params) {
  return new Class2({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _guid(Class2, params) {
  return new Class2({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuidv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
function _uuidv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
function _uuidv7(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
function _url(Class2, params) {
  return new Class2({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _emoji2(Class2, params) {
  return new Class2({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _nanoid(Class2, params) {
  return new Class2({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid2(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ulid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _xid(Class2, params) {
  return new Class2({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ksuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64url(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _e164(Class2, params) {
  return new Class2({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _jwt(Class2, params) {
  return new Class2({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _isoDateTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDate(Class2, params) {
  return new Class2({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _isoTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDuration(Class2, params) {
  return new Class2({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _number(Class2, params) {
  return new Class2({
    type: "number",
    checks: [],
    ...normalizeParams(params)
  });
}
function _coercedNumber(Class2, params) {
  return new Class2({
    type: "number",
    coerce: true,
    checks: [],
    ...normalizeParams(params)
  });
}
function _int(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
function _boolean(Class2, params) {
  return new Class2({
    type: "boolean",
    ...normalizeParams(params)
  });
}
function _coercedBoolean(Class2, params) {
  return new Class2({
    type: "boolean",
    coerce: true,
    ...normalizeParams(params)
  });
}
function _coercedBigint(Class2, params) {
  return new Class2({
    type: "bigint",
    coerce: true,
    ...normalizeParams(params)
  });
}
function _any(Class2) {
  return new Class2({
    type: "any"
  });
}
function _unknown(Class2) {
  return new Class2({
    type: "unknown"
  });
}
function _never(Class2, params) {
  return new Class2({
    type: "never",
    ...normalizeParams(params)
  });
}
function _date(Class2, params) {
  return new Class2({
    type: "date",
    ...normalizeParams(params)
  });
}
function _coercedDate(Class2, params) {
  return new Class2({
    type: "date",
    coerce: true,
    ...normalizeParams(params)
  });
}
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
function _normalize(form) {
  return _overwrite((input) => input.normalize(form));
}
function _trim() {
  return _overwrite((input) => input.trim());
}
function _toLowerCase() {
  return _overwrite((input) => input.toLowerCase());
}
function _toUpperCase() {
  return _overwrite((input) => input.toUpperCase());
}
function _array(Class2, element, params) {
  return new Class2({
    type: "array",
    element,
    // get element() {
    //   return element;
    // },
    ...normalizeParams(params)
  });
}
function _custom(Class2, fn, _params) {
  const norm = normalizeParams(_params);
  norm.abort ?? (norm.abort = true);
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...norm
  });
  return schema;
}
function _refine(Class2, fn, _params) {
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}
function _superRefine(fn) {
  const ch = _check((payload) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, ch._zod.def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(issue(_issue));
      }
    };
    return fn(payload.value, payload);
  });
  return ch;
}
function _check(fn, params) {
  const ch = new $ZodCheck({
    check: "custom",
    ...normalizeParams(params)
  });
  ch._zod.check = fn;
  return ch;
}

// node_modules/zod/v4/classic/iso.js
var ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function datetime2(params) {
  return _isoDateTime(ZodISODateTime, params);
}
var ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function date2(params) {
  return _isoDate(ZodISODate, params);
}
var ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function time2(params) {
  return _isoTime(ZodISOTime, params);
}
var ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function duration2(params) {
  return _isoDuration(ZodISODuration, params);
}

// node_modules/zod/v4/classic/errors.js
var initializer2 = (inst, issues) => {
  $ZodError.init(inst, issues);
  inst.name = "ZodError";
  Object.defineProperties(inst, {
    format: {
      value: (mapper) => formatError(inst, mapper)
      // enumerable: false,
    },
    flatten: {
      value: (mapper) => flattenError(inst, mapper)
      // enumerable: false,
    },
    addIssue: {
      value: (issue2) => {
        inst.issues.push(issue2);
        inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
      }
      // enumerable: false,
    },
    addIssues: {
      value: (issues2) => {
        inst.issues.push(...issues2);
        inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
      }
      // enumerable: false,
    },
    isEmpty: {
      get() {
        return inst.issues.length === 0;
      }
      // enumerable: false,
    }
  });
};
var ZodError = $constructor("ZodError", initializer2);
var ZodRealError = $constructor("ZodError", initializer2, {
  Parent: Error
});

// node_modules/zod/v4/classic/parse.js
var parse2 = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync2 = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse2 = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync2 = /* @__PURE__ */ _safeParseAsync(ZodRealError);
var encode = /* @__PURE__ */ _encode(ZodRealError);
var decode = /* @__PURE__ */ _decode(ZodRealError);
var encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
var decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
var safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
var safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
var safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
var safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);

// node_modules/zod/v4/classic/schemas.js
var ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
  $ZodType.init(inst, def);
  inst.def = def;
  inst.type = def.type;
  Object.defineProperty(inst, "_def", { value: def });
  inst.check = (...checks) => {
    return inst.clone(util_exports.mergeDefs(def, {
      checks: [
        ...def.checks ?? [],
        ...checks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
      ]
    }));
  };
  inst.clone = (def2, params) => clone(inst, def2, params);
  inst.brand = () => inst;
  inst.register = ((reg, meta) => {
    reg.add(inst, meta);
    return inst;
  });
  inst.parse = (data, params) => parse2(inst, data, params, { callee: inst.parse });
  inst.safeParse = (data, params) => safeParse2(inst, data, params);
  inst.parseAsync = async (data, params) => parseAsync2(inst, data, params, { callee: inst.parseAsync });
  inst.safeParseAsync = async (data, params) => safeParseAsync2(inst, data, params);
  inst.spa = inst.safeParseAsync;
  inst.encode = (data, params) => encode(inst, data, params);
  inst.decode = (data, params) => decode(inst, data, params);
  inst.encodeAsync = async (data, params) => encodeAsync(inst, data, params);
  inst.decodeAsync = async (data, params) => decodeAsync(inst, data, params);
  inst.safeEncode = (data, params) => safeEncode(inst, data, params);
  inst.safeDecode = (data, params) => safeDecode(inst, data, params);
  inst.safeEncodeAsync = async (data, params) => safeEncodeAsync(inst, data, params);
  inst.safeDecodeAsync = async (data, params) => safeDecodeAsync(inst, data, params);
  inst.refine = (check, params) => inst.check(refine(check, params));
  inst.superRefine = (refinement) => inst.check(superRefine(refinement));
  inst.overwrite = (fn) => inst.check(_overwrite(fn));
  inst.optional = () => optional(inst);
  inst.nullable = () => nullable(inst);
  inst.nullish = () => optional(nullable(inst));
  inst.nonoptional = (params) => nonoptional(inst, params);
  inst.array = () => array(inst);
  inst.or = (arg) => union([inst, arg]);
  inst.and = (arg) => intersection(inst, arg);
  inst.transform = (tx) => pipe(inst, transform(tx));
  inst.default = (def2) => _default(inst, def2);
  inst.prefault = (def2) => prefault(inst, def2);
  inst.catch = (params) => _catch(inst, params);
  inst.pipe = (target) => pipe(inst, target);
  inst.readonly = () => readonly(inst);
  inst.describe = (description) => {
    const cl = inst.clone();
    globalRegistry.add(cl, { description });
    return cl;
  };
  Object.defineProperty(inst, "description", {
    get() {
      var _a2;
      return (_a2 = globalRegistry.get(inst)) == null ? void 0 : _a2.description;
    },
    configurable: true
  });
  inst.meta = (...args) => {
    if (args.length === 0) {
      return globalRegistry.get(inst);
    }
    const cl = inst.clone();
    globalRegistry.add(cl, args[0]);
    return cl;
  };
  inst.isOptional = () => inst.safeParse(void 0).success;
  inst.isNullable = () => inst.safeParse(null).success;
  return inst;
});
var _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  ZodType.init(inst, def);
  const bag = inst._zod.bag;
  inst.format = bag.format ?? null;
  inst.minLength = bag.minimum ?? null;
  inst.maxLength = bag.maximum ?? null;
  inst.regex = (...args) => inst.check(_regex(...args));
  inst.includes = (...args) => inst.check(_includes(...args));
  inst.startsWith = (...args) => inst.check(_startsWith(...args));
  inst.endsWith = (...args) => inst.check(_endsWith(...args));
  inst.min = (...args) => inst.check(_minLength(...args));
  inst.max = (...args) => inst.check(_maxLength(...args));
  inst.length = (...args) => inst.check(_length(...args));
  inst.nonempty = (...args) => inst.check(_minLength(1, ...args));
  inst.lowercase = (params) => inst.check(_lowercase(params));
  inst.uppercase = (params) => inst.check(_uppercase(params));
  inst.trim = () => inst.check(_trim());
  inst.normalize = (...args) => inst.check(_normalize(...args));
  inst.toLowerCase = () => inst.check(_toLowerCase());
  inst.toUpperCase = () => inst.check(_toUpperCase());
});
var ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  _ZodString.init(inst, def);
  inst.email = (params) => inst.check(_email(ZodEmail, params));
  inst.url = (params) => inst.check(_url(ZodURL, params));
  inst.jwt = (params) => inst.check(_jwt(ZodJWT, params));
  inst.emoji = (params) => inst.check(_emoji2(ZodEmoji, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.uuid = (params) => inst.check(_uuid(ZodUUID, params));
  inst.uuidv4 = (params) => inst.check(_uuidv4(ZodUUID, params));
  inst.uuidv6 = (params) => inst.check(_uuidv6(ZodUUID, params));
  inst.uuidv7 = (params) => inst.check(_uuidv7(ZodUUID, params));
  inst.nanoid = (params) => inst.check(_nanoid(ZodNanoID, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.cuid = (params) => inst.check(_cuid(ZodCUID, params));
  inst.cuid2 = (params) => inst.check(_cuid2(ZodCUID2, params));
  inst.ulid = (params) => inst.check(_ulid(ZodULID, params));
  inst.base64 = (params) => inst.check(_base64(ZodBase64, params));
  inst.base64url = (params) => inst.check(_base64url(ZodBase64URL, params));
  inst.xid = (params) => inst.check(_xid(ZodXID, params));
  inst.ksuid = (params) => inst.check(_ksuid(ZodKSUID, params));
  inst.ipv4 = (params) => inst.check(_ipv4(ZodIPv4, params));
  inst.ipv6 = (params) => inst.check(_ipv6(ZodIPv6, params));
  inst.cidrv4 = (params) => inst.check(_cidrv4(ZodCIDRv4, params));
  inst.cidrv6 = (params) => inst.check(_cidrv6(ZodCIDRv6, params));
  inst.e164 = (params) => inst.check(_e164(ZodE164, params));
  inst.datetime = (params) => inst.check(datetime2(params));
  inst.date = (params) => inst.check(date2(params));
  inst.time = (params) => inst.check(time2(params));
  inst.duration = (params) => inst.check(duration2(params));
});
function string2(params) {
  return _string(ZodString, params);
}
var ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  _ZodString.init(inst, def);
});
var ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNumber = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
  $ZodNumber.init(inst, def);
  ZodType.init(inst, def);
  inst.gt = (value, params) => inst.check(_gt(value, params));
  inst.gte = (value, params) => inst.check(_gte(value, params));
  inst.min = (value, params) => inst.check(_gte(value, params));
  inst.lt = (value, params) => inst.check(_lt(value, params));
  inst.lte = (value, params) => inst.check(_lte(value, params));
  inst.max = (value, params) => inst.check(_lte(value, params));
  inst.int = (params) => inst.check(int(params));
  inst.safe = (params) => inst.check(int(params));
  inst.positive = (params) => inst.check(_gt(0, params));
  inst.nonnegative = (params) => inst.check(_gte(0, params));
  inst.negative = (params) => inst.check(_lt(0, params));
  inst.nonpositive = (params) => inst.check(_lte(0, params));
  inst.multipleOf = (value, params) => inst.check(_multipleOf(value, params));
  inst.step = (value, params) => inst.check(_multipleOf(value, params));
  inst.finite = () => inst;
  const bag = inst._zod.bag;
  inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
  inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
  inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? 0.5);
  inst.isFinite = true;
  inst.format = bag.format ?? null;
});
function number2(params) {
  return _number(ZodNumber, params);
}
var ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def);
  ZodNumber.init(inst, def);
});
function int(params) {
  return _int(ZodNumberFormat, params);
}
var ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodType.init(inst, def);
});
function boolean2(params) {
  return _boolean(ZodBoolean, params);
}
var ZodBigInt = /* @__PURE__ */ $constructor("ZodBigInt", (inst, def) => {
  $ZodBigInt.init(inst, def);
  ZodType.init(inst, def);
  inst.gte = (value, params) => inst.check(_gte(value, params));
  inst.min = (value, params) => inst.check(_gte(value, params));
  inst.gt = (value, params) => inst.check(_gt(value, params));
  inst.gte = (value, params) => inst.check(_gte(value, params));
  inst.min = (value, params) => inst.check(_gte(value, params));
  inst.lt = (value, params) => inst.check(_lt(value, params));
  inst.lte = (value, params) => inst.check(_lte(value, params));
  inst.max = (value, params) => inst.check(_lte(value, params));
  inst.positive = (params) => inst.check(_gt(BigInt(0), params));
  inst.negative = (params) => inst.check(_lt(BigInt(0), params));
  inst.nonpositive = (params) => inst.check(_lte(BigInt(0), params));
  inst.nonnegative = (params) => inst.check(_gte(BigInt(0), params));
  inst.multipleOf = (value, params) => inst.check(_multipleOf(value, params));
  const bag = inst._zod.bag;
  inst.minValue = bag.minimum ?? null;
  inst.maxValue = bag.maximum ?? null;
  inst.format = bag.format ?? null;
});
var ZodAny = /* @__PURE__ */ $constructor("ZodAny", (inst, def) => {
  $ZodAny.init(inst, def);
  ZodType.init(inst, def);
});
function any() {
  return _any(ZodAny);
}
var ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodType.init(inst, def);
});
function unknown() {
  return _unknown(ZodUnknown);
}
var ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodType.init(inst, def);
});
function never(params) {
  return _never(ZodNever, params);
}
var ZodDate = /* @__PURE__ */ $constructor("ZodDate", (inst, def) => {
  $ZodDate.init(inst, def);
  ZodType.init(inst, def);
  inst.min = (value, params) => inst.check(_gte(value, params));
  inst.max = (value, params) => inst.check(_lte(value, params));
  const c = inst._zod.bag;
  inst.minDate = c.minimum ? new Date(c.minimum) : null;
  inst.maxDate = c.maximum ? new Date(c.maximum) : null;
});
function date3(params) {
  return _date(ZodDate, params);
}
var ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  $ZodArray.init(inst, def);
  ZodType.init(inst, def);
  inst.element = def.element;
  inst.min = (minLength, params) => inst.check(_minLength(minLength, params));
  inst.nonempty = (params) => inst.check(_minLength(1, params));
  inst.max = (maxLength, params) => inst.check(_maxLength(maxLength, params));
  inst.length = (len, params) => inst.check(_length(len, params));
  inst.unwrap = () => inst.element;
});
function array(element, params) {
  return _array(ZodArray, element, params);
}
var ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  $ZodObjectJIT.init(inst, def);
  ZodType.init(inst, def);
  util_exports.defineLazy(inst, "shape", () => {
    return def.shape;
  });
  inst.keyof = () => _enum(Object.keys(inst._zod.def.shape));
  inst.catchall = (catchall) => inst.clone({ ...inst._zod.def, catchall });
  inst.passthrough = () => inst.clone({ ...inst._zod.def, catchall: unknown() });
  inst.loose = () => inst.clone({ ...inst._zod.def, catchall: unknown() });
  inst.strict = () => inst.clone({ ...inst._zod.def, catchall: never() });
  inst.strip = () => inst.clone({ ...inst._zod.def, catchall: void 0 });
  inst.extend = (incoming) => {
    return util_exports.extend(inst, incoming);
  };
  inst.safeExtend = (incoming) => {
    return util_exports.safeExtend(inst, incoming);
  };
  inst.merge = (other) => util_exports.merge(inst, other);
  inst.pick = (mask) => util_exports.pick(inst, mask);
  inst.omit = (mask) => util_exports.omit(inst, mask);
  inst.partial = (...args) => util_exports.partial(ZodOptional, inst, args[0]);
  inst.required = (...args) => util_exports.required(ZodNonOptional, inst, args[0]);
});
function object(shape, params) {
  const def = {
    type: "object",
    shape: shape ?? {},
    ...util_exports.normalizeParams(params)
  };
  return new ZodObject(def);
}
var ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodType.init(inst, def);
  inst.options = def.options;
});
function union(options, params) {
  return new ZodUnion({
    type: "union",
    options,
    ...util_exports.normalizeParams(params)
  });
}
var ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def);
  ZodType.init(inst, def);
});
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
var ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
  $ZodRecord.init(inst, def);
  ZodType.init(inst, def);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodType.init(inst, def);
  inst.enum = def.entries;
  inst.options = Object.values(def.entries);
  const keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum({
    type: "enum",
    entries,
    ...util_exports.normalizeParams(params)
  });
}
var ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst.values = new Set(def.values);
  Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1) {
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      }
      return def.values[0];
    }
  });
});
function literal(value, params) {
  return new ZodLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...util_exports.normalizeParams(params)
  });
}
var ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  $ZodTransform.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    if (_ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(util_exports.issue(issue2, payload.value, def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = inst);
        payload.issues.push(util_exports.issue(_issue));
      }
    };
    const output = def.transform(payload.value, payload);
    if (output instanceof Promise) {
      return output.then((output2) => {
        payload.value = output2;
        return payload;
      });
    }
    payload.value = output;
    return payload;
  };
});
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
var ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
var ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
var ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : util_exports.shallowClone(defaultValue);
    }
  });
}
var ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : util_exports.shallowClone(defaultValue);
    }
  });
}
var ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
  $ZodNonOptional.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
  });
}
var ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodType.init(inst, def);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
    // ...util.normalizeParams(params),
  });
}
var ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
var ZodLazy = /* @__PURE__ */ $constructor("ZodLazy", (inst, def) => {
  $ZodLazy.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.getter();
});
function lazy(getter) {
  return new ZodLazy({
    type: "lazy",
    getter
  });
}
var ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodType.init(inst, def);
});
function custom(fn, _params) {
  return _custom(ZodCustom, fn ?? (() => true), _params);
}
function refine(fn, _params = {}) {
  return _refine(ZodCustom, fn, _params);
}
function superRefine(fn) {
  return _superRefine(fn);
}

// node_modules/zod/v4/classic/compat.js
var ZodIssueCode = {
  invalid_type: "invalid_type",
  too_big: "too_big",
  too_small: "too_small",
  invalid_format: "invalid_format",
  not_multiple_of: "not_multiple_of",
  unrecognized_keys: "unrecognized_keys",
  invalid_union: "invalid_union",
  invalid_key: "invalid_key",
  invalid_element: "invalid_element",
  invalid_value: "invalid_value",
  custom: "custom"
};
var ZodFirstPartyTypeKind;
/* @__PURE__ */ (function(ZodFirstPartyTypeKind3) {
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));

// node_modules/zod/v4/classic/coerce.js
var coerce_exports = {};
__export(coerce_exports, {
  bigint: () => bigint2,
  boolean: () => boolean3,
  date: () => date4,
  number: () => number3,
  string: () => string3
});
function string3(params) {
  return _coercedString(ZodString, params);
}
function number3(params) {
  return _coercedNumber(ZodNumber, params);
}
function boolean3(params) {
  return _coercedBoolean(ZodBoolean, params);
}
function bigint2(params) {
  return _coercedBigint(ZodBigInt, params);
}
function date4(params) {
  return _coercedDate(ZodDate, params);
}

// node_modules/zod/v4/classic/external.js
config(en_default());

// node_modules/@openrouter/sdk/esm/lib/base64.js
function bytesToBase64(u8arr) {
  return btoa(String.fromCodePoint(...u8arr));
}
function bytesFromBase64(encoded) {
  return Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
}
function stringToBytes(str) {
  return new TextEncoder().encode(str);
}
function stringToBase64(str) {
  return bytesToBase64(stringToBytes(str));
}
var zodOutbound = custom((x) => x instanceof Uint8Array).or(string2().transform(stringToBytes));
var zodInbound = custom((x) => x instanceof Uint8Array).or(string2().transform(bytesFromBase64));

// node_modules/@openrouter/sdk/esm/lib/is-plain-object.js
function isPlainObject2(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
}

// node_modules/@openrouter/sdk/esm/lib/encodings.js
var EncodingError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "EncodingError";
  }
};
function formEncoder(sep) {
  return (key, value, options) => {
    let out = "";
    const pairs = (options == null ? void 0 : options.explode) ? explode(key, value) : [[key, value]];
    if (pairs.every(([_, v]) => v == null)) {
      return;
    }
    const encodeString = (v) => {
      return (options == null ? void 0 : options.charEncoding) === "percent" ? encodeURIComponent(v) : v;
    };
    const encodeValue = (v) => encodeString(serializeValue(v));
    const encodedSep = encodeString(sep);
    pairs.forEach(([pk, pv]) => {
      var _a2, _b;
      let tmp = "";
      let encValue = null;
      if (pv == null) {
        return;
      } else if (Array.isArray(pv)) {
        encValue = (_a2 = mapDefined(pv, (v) => `${encodeValue(v)}`)) == null ? void 0 : _a2.join(encodedSep);
      } else if (isPlainObject2(pv)) {
        encValue = (_b = mapDefinedEntries(Object.entries(pv), ([k, v]) => {
          return `${encodeString(k)}${encodedSep}${encodeValue(v)}`;
        })) == null ? void 0 : _b.join(encodedSep);
      } else {
        encValue = `${encodeValue(pv)}`;
      }
      if (encValue == null) {
        return;
      }
      tmp = `${encodeString(pk)}=${encValue}`;
      if (!tmp || tmp === "=") {
        return;
      }
      out += `&${tmp}`;
    });
    return out.slice(1);
  };
}
var encodeForm = formEncoder(",");
var encodeSpaceDelimited = formEncoder(" ");
var encodePipeDelimited = formEncoder("|");
function encodeDeepObject(key, value, options) {
  if (value == null) {
    return;
  }
  if (!isPlainObject2(value)) {
    throw new EncodingError(`Value of parameter '${key}' which uses deepObject encoding must be an object or null`);
  }
  return encodeDeepObjectObject(key, value, options);
}
function encodeDeepObjectObject(key, value, options) {
  if (value == null) {
    return;
  }
  let out = "";
  const encodeString = (v) => {
    return (options == null ? void 0 : options.charEncoding) === "percent" ? encodeURIComponent(v) : v;
  };
  if (!isPlainObject2(value)) {
    throw new EncodingError(`Expected parameter '${key}' to be an object.`);
  }
  Object.entries(value).forEach(([ck, cv]) => {
    var _a2;
    if (cv == null) {
      return;
    }
    const pk = `${key}[${ck}]`;
    if (isPlainObject2(cv)) {
      const objOut = encodeDeepObjectObject(pk, cv, options);
      out += objOut == null ? "" : `&${objOut}`;
      return;
    }
    const pairs = Array.isArray(cv) ? cv : [cv];
    const encoded = (_a2 = mapDefined(pairs, (v) => {
      return `${encodeString(pk)}=${encodeString(serializeValue(v))}`;
    })) == null ? void 0 : _a2.join("&");
    out += encoded == null ? "" : `&${encoded}`;
  });
  return out.slice(1);
}
function encodeJSON(key, value, options) {
  if (typeof value === "undefined") {
    return;
  }
  const encodeString = (v) => {
    return (options == null ? void 0 : options.charEncoding) === "percent" ? encodeURIComponent(v) : v;
  };
  const encVal = encodeString(JSON.stringify(value, jsonReplacer));
  return (options == null ? void 0 : options.explode) ? encVal : `${encodeString(key)}=${encVal}`;
}
var encodeSimple = (key, value, options) => {
  let out = "";
  const pairs = (options == null ? void 0 : options.explode) ? explode(key, value) : [[key, value]];
  if (pairs.every(([_, v]) => v == null)) {
    return;
  }
  const encodeString = (v) => {
    return (options == null ? void 0 : options.charEncoding) === "percent" ? encodeURIComponent(v) : v;
  };
  const encodeValue = (v) => encodeString(serializeValue(v));
  pairs.forEach(([pk, pv]) => {
    var _a2;
    let tmp = "";
    if (pv == null) {
      return;
    } else if (Array.isArray(pv)) {
      tmp = (_a2 = mapDefined(pv, (v) => `${encodeValue(v)}`)) == null ? void 0 : _a2.join(",");
    } else if (isPlainObject2(pv)) {
      const mapped = mapDefinedEntries(Object.entries(pv), ([k, v]) => {
        return `,${encodeString(k)},${encodeValue(v)}`;
      });
      tmp = mapped == null ? void 0 : mapped.join("").slice(1);
    } else {
      const k = (options == null ? void 0 : options.explode) && isPlainObject2(value) ? `${pk}=` : "";
      tmp = `${k}${encodeValue(pv)}`;
    }
    out += tmp ? `,${tmp}` : "";
  });
  return out.slice(1);
};
function explode(key, value) {
  if (Array.isArray(value)) {
    return value.map((v) => [key, v]);
  } else if (isPlainObject2(value)) {
    const o = value ?? {};
    return Object.entries(o).map(([k, v]) => [k, v]);
  } else {
    return [[key, value]];
  }
}
function serializeValue(value) {
  if (value == null) {
    return "";
  } else if (value instanceof Date) {
    return value.toISOString();
  } else if (value instanceof Uint8Array) {
    return bytesToBase64(value);
  } else if (typeof value === "object") {
    return JSON.stringify(value, jsonReplacer);
  }
  return `${value}`;
}
function jsonReplacer(_, value) {
  if (value instanceof Uint8Array) {
    return bytesToBase64(value);
  } else {
    return value;
  }
}
function mapDefined(inp, mapper) {
  const res = inp.reduce((acc, v) => {
    if (v == null) {
      return acc;
    }
    const m = mapper(v);
    if (m == null) {
      return acc;
    }
    acc.push(m);
    return acc;
  }, []);
  return res.length ? res : null;
}
function mapDefinedEntries(inp, mapper) {
  const acc = [];
  for (const [k, v] of inp) {
    if (v == null) {
      continue;
    }
    const m = mapper([k, v]);
    if (m == null) {
      continue;
    }
    acc.push(m);
  }
  return acc.length ? acc : null;
}
function queryJoin(...args) {
  return args.filter(Boolean).join("&");
}
function queryEncoder(f) {
  const bulkEncode = function(values, options) {
    const opts = {
      ...options,
      explode: (options == null ? void 0 : options.explode) ?? true,
      charEncoding: (options == null ? void 0 : options.charEncoding) ?? "percent"
    };
    const encoded = Object.entries(values).map(([key, value]) => {
      return f(key, value, opts);
    });
    return queryJoin(...encoded);
  };
  return bulkEncode;
}
var encodeJSONQuery = queryEncoder(encodeJSON);
var encodeFormQuery = queryEncoder(encodeForm);
var encodeSpaceDelimitedQuery = queryEncoder(encodeSpaceDelimited);
var encodePipeDelimitedQuery = queryEncoder(encodePipeDelimited);
var encodeDeepObjectQuery = queryEncoder(encodeDeepObject);

// node_modules/@openrouter/sdk/esm/lib/dlv.js
function dlv(obj, key, def, p, undef) {
  key = Array.isArray(key) ? key : key.split(".");
  for (p = 0; p < key.length; p++) {
    const k = key[p];
    obj = k != null && obj ? obj[k] : undef;
  }
  return obj === undef ? def : obj;
}

// node_modules/@openrouter/sdk/esm/lib/env.js
var envSchema = object({
  OPENROUTER_API_KEY: string2().optional(),
  OPENROUTER_DEBUG: coerce_exports.boolean().optional()
});
function isDeno() {
  if ("Deno" in globalThis) {
    return true;
  }
  return false;
}
var envMemo = void 0;
function env() {
  var _a2, _b, _c;
  if (envMemo) {
    return envMemo;
  }
  let envObject = {};
  if (isDeno()) {
    envObject = ((_c = (_b = (_a2 = globalThis.Deno) == null ? void 0 : _a2.env) == null ? void 0 : _b.toObject) == null ? void 0 : _c.call(_b)) ?? {};
  } else {
    envObject = dlv(globalThis, "process.env") ?? {};
  }
  envMemo = envSchema.parse(envObject);
  return envMemo;
}

// node_modules/@openrouter/sdk/esm/lib/retries.js
var defaultBackoff = {
  initialInterval: 500,
  maxInterval: 6e4,
  exponent: 1.5,
  maxElapsedTime: 36e5
};
var PermanentError = class _PermanentError extends Error {
  constructor(message, options) {
    let msg = message;
    if (options == null ? void 0 : options.cause) {
      msg += `: ${options.cause}`;
    }
    super(msg, options);
    this.name = "PermanentError";
    if (typeof this.cause === "undefined") {
      this.cause = options == null ? void 0 : options.cause;
    }
    Object.setPrototypeOf(this, _PermanentError.prototype);
  }
};
var TemporaryError = class _TemporaryError extends Error {
  constructor(message, response) {
    super(message);
    this.response = response;
    this.name = "TemporaryError";
    Object.setPrototypeOf(this, _TemporaryError.prototype);
  }
};
async function retry(fetchFn, options) {
  switch (options.config.strategy) {
    case "backoff":
      return retryBackoff(wrapFetcher(fetchFn, {
        statusCodes: options.statusCodes,
        retryConnectionErrors: !!options.config.retryConnectionErrors
      }), options.config.backoff ?? defaultBackoff);
    default:
      return await fetchFn();
  }
}
function wrapFetcher(fn, options) {
  return async () => {
    try {
      const res = await fn();
      if (isRetryableResponse(res, options.statusCodes)) {
        throw new TemporaryError("Response failed with retryable status code", res);
      }
      return res;
    } catch (err) {
      if (err instanceof TemporaryError) {
        throw err;
      }
      if (options.retryConnectionErrors && (isTimeoutError(err) || isConnectionError(err))) {
        throw err;
      }
      throw new PermanentError("Permanent error", { cause: err });
    }
  };
}
var codeRangeRE2 = new RegExp("^[0-9]xx$", "i");
function isRetryableResponse(res, statusCodes) {
  const actual = `${res.status}`;
  return statusCodes.some((code) => {
    if (!codeRangeRE2.test(code)) {
      return code === actual;
    }
    const expectFamily = code.charAt(0);
    if (!expectFamily) {
      throw new Error("Invalid status code range");
    }
    const actualFamily = actual.charAt(0);
    if (!actualFamily) {
      throw new Error(`Invalid response status code: ${actual}`);
    }
    return actualFamily === expectFamily;
  });
}
async function retryBackoff(fn, strategy) {
  const { maxElapsedTime, initialInterval, exponent, maxInterval } = strategy;
  const start = Date.now();
  let x = 0;
  while (true) {
    try {
      const res = await fn();
      return res;
    } catch (err) {
      if (err instanceof PermanentError) {
        throw err.cause;
      }
      const elapsed = Date.now() - start;
      if (elapsed > maxElapsedTime) {
        if (err instanceof TemporaryError) {
          return err.response;
        }
        throw err;
      }
      let retryInterval = 0;
      if (err instanceof TemporaryError) {
        retryInterval = retryIntervalFromResponse(err.response);
      }
      if (retryInterval <= 0) {
        retryInterval = initialInterval * Math.pow(x, exponent) + Math.random() * 1e3;
      }
      const d = Math.min(retryInterval, maxInterval);
      await delay(d);
      x++;
    }
  }
}
function retryIntervalFromResponse(res) {
  const retryVal = res.headers.get("retry-after") || "";
  if (!retryVal) {
    return 0;
  }
  const parsedNumber = Number(retryVal);
  if (Number.isInteger(parsedNumber)) {
    return parsedNumber * 1e3;
  }
  const parsedDate = Date.parse(retryVal);
  if (Number.isInteger(parsedDate)) {
    const deltaMS = parsedDate - Date.now();
    return deltaMS > 0 ? Math.ceil(deltaMS) : 0;
  }
  return 0;
}
async function delay(delay2) {
  return new Promise((resolve) => setTimeout(resolve, delay2));
}

// node_modules/@openrouter/sdk/esm/lib/sdks.js
var __classPrivateFieldSet = function(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet = function(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _ClientSDK_httpClient;
var _ClientSDK_hooks;
var _ClientSDK_logger;
var gt = typeof globalThis === "undefined" ? null : globalThis;
var webWorkerLike = typeof gt === "object" && gt != null && "importScripts" in gt && typeof gt["importScripts"] === "function";
var isBrowserLike = webWorkerLike || typeof navigator !== "undefined" && "serviceWorker" in navigator || typeof window === "object" && typeof window.document !== "undefined";
var ClientSDK = class {
  constructor(options = {}) {
    _ClientSDK_httpClient.set(this, void 0);
    _ClientSDK_hooks.set(this, void 0);
    _ClientSDK_logger.set(this, void 0);
    const opt = options;
    if (typeof opt === "object" && opt != null && "hooks" in opt && opt.hooks instanceof SDKHooks) {
      __classPrivateFieldSet(this, _ClientSDK_hooks, opt.hooks, "f");
    } else {
      __classPrivateFieldSet(this, _ClientSDK_hooks, new SDKHooks(), "f");
    }
    const defaultHttpClient = new HTTPClient();
    options.httpClient = options.httpClient || defaultHttpClient;
    options = __classPrivateFieldGet(this, _ClientSDK_hooks, "f").sdkInit(options);
    const url = serverURLFromOptions(options);
    if (url) {
      url.pathname = url.pathname.replace(/\/+$/, "") + "/";
    }
    this._baseURL = url;
    __classPrivateFieldSet(this, _ClientSDK_httpClient, options.httpClient || defaultHttpClient, "f");
    this._options = { ...options, hooks: __classPrivateFieldGet(this, _ClientSDK_hooks, "f") };
    __classPrivateFieldSet(this, _ClientSDK_logger, this._options.debugLogger, "f");
    if (!__classPrivateFieldGet(this, _ClientSDK_logger, "f") && env().OPENROUTER_DEBUG) {
      __classPrivateFieldSet(this, _ClientSDK_logger, console, "f");
    }
  }
  _createRequest(context, conf, options) {
    var _a2;
    const { method, path, query, headers: opHeaders, security } = conf;
    const base = conf.baseURL ?? this._baseURL;
    if (!base) {
      return ERR(new InvalidRequestError("No base URL provided for operation"));
    }
    const reqURL = new URL(base);
    const inputURL = new URL(path, reqURL);
    if (path) {
      reqURL.pathname += reqURL.pathname.endsWith("/") ? "" : "/";
      reqURL.pathname += inputURL.pathname.replace(/^\/+/, "");
    }
    let finalQuery = query || "";
    const secQuery = [];
    for (const [k, v] of Object.entries((security == null ? void 0 : security.queryParams) || {})) {
      const q = encodeForm(k, v, { charEncoding: "percent" });
      if (typeof q !== "undefined") {
        secQuery.push(q);
      }
    }
    if (secQuery.length) {
      finalQuery += `&${secQuery.join("&")}`;
    }
    if (finalQuery) {
      const q = finalQuery.startsWith("&") ? finalQuery.slice(1) : finalQuery;
      reqURL.search = `?${q}`;
    }
    const headers = new Headers(opHeaders);
    const username = security == null ? void 0 : security.basic.username;
    const password = security == null ? void 0 : security.basic.password;
    if (username != null || password != null) {
      const encoded = stringToBase64([username || "", password || ""].join(":"));
      headers.set("Authorization", `Basic ${encoded}`);
    }
    const securityHeaders = new Headers((security == null ? void 0 : security.headers) || {});
    for (const [k, v] of securityHeaders) {
      headers.set(k, v);
    }
    let cookie = headers.get("cookie") || "";
    for (const [k, v] of Object.entries((security == null ? void 0 : security.cookies) || {})) {
      cookie += `; ${k}=${v}`;
    }
    cookie = cookie.startsWith("; ") ? cookie.slice(2) : cookie;
    headers.set("cookie", cookie);
    const userHeaders = new Headers((options == null ? void 0 : options.headers) ?? ((_a2 = options == null ? void 0 : options.fetchOptions) == null ? void 0 : _a2.headers));
    for (const [k, v] of userHeaders) {
      headers.set(k, v);
    }
    if (!isBrowserLike) {
      headers.set(conf.uaHeader ?? "user-agent", conf.userAgent ?? SDK_METADATA.userAgent);
    }
    const fetchOptions = {
      ...options == null ? void 0 : options.fetchOptions,
      ...options
    };
    if (!(fetchOptions == null ? void 0 : fetchOptions.signal) && conf.timeoutMs && conf.timeoutMs > 0) {
      const timeoutSignal = AbortSignal.timeout(conf.timeoutMs);
      fetchOptions.signal = timeoutSignal;
    }
    if (conf.body instanceof ReadableStream) {
      Object.assign(fetchOptions, { duplex: "half" });
    }
    let input;
    try {
      input = __classPrivateFieldGet(this, _ClientSDK_hooks, "f").beforeCreateRequest(context, {
        url: reqURL,
        options: {
          ...fetchOptions,
          body: conf.body ?? null,
          headers,
          method
        }
      });
    } catch (err) {
      return ERR(new UnexpectedClientError("Create request hook failed to execute", {
        cause: err
      }));
    }
    return OK(new Request(input.url, input.options));
  }
  async _do(request, options) {
    const { context, errorCodes } = options;
    return retry(async () => {
      const req = await __classPrivateFieldGet(this, _ClientSDK_hooks, "f").beforeRequest(context, request.clone());
      await logRequest(__classPrivateFieldGet(this, _ClientSDK_logger, "f"), req).catch((e) => {
        var _a2;
        return (_a2 = __classPrivateFieldGet(this, _ClientSDK_logger, "f")) == null ? void 0 : _a2.log("Failed to log request:", e);
      });
      let response = await __classPrivateFieldGet(this, _ClientSDK_httpClient, "f").request(req);
      try {
        if (matchStatusCode(response, errorCodes)) {
          const result = await __classPrivateFieldGet(this, _ClientSDK_hooks, "f").afterError(context, response, null);
          if (result.error) {
            throw result.error;
          }
          response = result.response || response;
        } else {
          response = await __classPrivateFieldGet(this, _ClientSDK_hooks, "f").afterSuccess(context, response);
        }
      } finally {
        await logResponse(__classPrivateFieldGet(this, _ClientSDK_logger, "f"), response, req).catch((e) => {
          var _a2;
          return (_a2 = __classPrivateFieldGet(this, _ClientSDK_logger, "f")) == null ? void 0 : _a2.log("Failed to log response:", e);
        });
      }
      return response;
    }, { config: options.retryConfig, statusCodes: options.retryCodes }).then((r) => OK(r), (err) => {
      switch (true) {
        case isAbortError(err):
          return ERR(new RequestAbortedError("Request aborted by client", {
            cause: err
          }));
        case isTimeoutError(err):
          return ERR(new RequestTimeoutError("Request timed out", { cause: err }));
        case isConnectionError(err):
          return ERR(new ConnectionError("Unable to make request", { cause: err }));
        default:
          return ERR(new UnexpectedClientError("Unexpected HTTP client error", {
            cause: err
          }));
      }
    });
  }
};
_ClientSDK_httpClient = /* @__PURE__ */ new WeakMap(), _ClientSDK_hooks = /* @__PURE__ */ new WeakMap(), _ClientSDK_logger = /* @__PURE__ */ new WeakMap();
var jsonLikeContentTypeRE = /(application|text)\/.*?\+*json.*/;
var jsonlLikeContentTypeRE = /(application|text)\/(.*?\+*\bjsonl\b.*|.*?\+*\bx-ndjson\b.*)/;
async function logRequest(logger, req) {
  if (!logger) {
    return;
  }
  const contentType = req.headers.get("content-type");
  const ct = (contentType == null ? void 0 : contentType.split(";")[0]) || "";
  logger.group(`> Request: ${req.method} ${req.url}`);
  logger.group("Headers:");
  for (const [k, v] of req.headers.entries()) {
    logger.log(`${k}: ${v}`);
  }
  logger.groupEnd();
  logger.group("Body:");
  switch (true) {
    case jsonLikeContentTypeRE.test(ct):
      logger.log(await req.clone().json());
      break;
    case ct.startsWith("text/"):
      logger.log(await req.clone().text());
      break;
    case ct === "multipart/form-data": {
      const body = await req.clone().formData();
      for (const [k, v] of body) {
        const vlabel = v instanceof Blob ? "<Blob>" : v;
        logger.log(`${k}: ${vlabel}`);
      }
      break;
    }
    default:
      logger.log(`<${contentType}>`);
      break;
  }
  logger.groupEnd();
  logger.groupEnd();
}
async function logResponse(logger, res, req) {
  if (!logger) {
    return;
  }
  const contentType = res.headers.get("content-type");
  const ct = (contentType == null ? void 0 : contentType.split(";")[0]) || "";
  logger.group(`< Response: ${req.method} ${req.url}`);
  logger.log("Status Code:", res.status, res.statusText);
  logger.group("Headers:");
  for (const [k, v] of res.headers.entries()) {
    logger.log(`${k}: ${v}`);
  }
  logger.groupEnd();
  logger.group("Body:");
  switch (true) {
    case (matchContentType(res, "application/json") || jsonLikeContentTypeRE.test(ct) && !jsonlLikeContentTypeRE.test(ct)):
      logger.log(await res.clone().json());
      break;
    case (matchContentType(res, "application/jsonl") || jsonlLikeContentTypeRE.test(ct)):
      logger.log(await res.clone().text());
      break;
    case matchContentType(res, "text/event-stream"):
      logger.log(`<${contentType}>`);
      break;
    case matchContentType(res, "text/*"):
      logger.log(await res.clone().text());
      break;
    case matchContentType(res, "multipart/form-data"): {
      const body = await res.clone().formData();
      for (const [k, v] of body) {
        const vlabel = v instanceof Blob ? "<Blob>" : v;
        logger.log(`${k}: ${vlabel}`);
      }
      break;
    }
    default:
      logger.log(`<${contentType}>`);
      break;
  }
  logger.groupEnd();
  logger.groupEnd();
}

// node_modules/@openrouter/sdk/esm/models/errors/openroutererror.js
var OpenRouterError = class extends Error {
  constructor(message, httpMeta) {
    super(message);
    this.statusCode = httpMeta.response.status;
    this.body = httpMeta.body;
    this.headers = httpMeta.response.headers;
    this.contentType = httpMeta.response.headers.get("content-type") || "";
    this.rawResponse = httpMeta.response;
    this.name = "OpenRouterError";
  }
};

// node_modules/@openrouter/sdk/esm/models/errors/openrouterdefaulterror.js
var OpenRouterDefaultError = class extends OpenRouterError {
  constructor(message, httpMeta) {
    if (message) {
      message += `: `;
    }
    message += `Status ${httpMeta.response.status}`;
    const contentType = httpMeta.response.headers.get("content-type") || `""`;
    if (contentType !== "application/json") {
      message += ` Content-Type ${contentType.includes(" ") ? `"${contentType}"` : contentType}`;
    }
    const body = httpMeta.body || `""`;
    message += body.length > 100 ? "\n" : ". ";
    let bodyDisplay = body;
    if (body.length > 1e4) {
      const truncated = body.substring(0, 1e4);
      const remaining = body.length - 1e4;
      bodyDisplay = `${truncated}...and ${remaining} more chars`;
    }
    message += `Body: ${bodyDisplay}`;
    message = message.trim();
    super(message, httpMeta);
    this.name = "OpenRouterDefaultError";
  }
};

// node_modules/@openrouter/sdk/esm/models/errors/sdkvalidationerror.js
var SDKValidationError = class extends Error {
  // Allows for backwards compatibility for `instanceof` checks of `ResponseValidationError`
  static [Symbol.hasInstance](instance) {
    if (!(instance instanceof Error))
      return false;
    if (!("rawValue" in instance))
      return false;
    if (!("rawMessage" in instance))
      return false;
    if (!("pretty" in instance))
      return false;
    if (typeof instance.pretty !== "function")
      return false;
    return true;
  }
  constructor(message, cause, rawValue) {
    super(`${message}: ${cause}`);
    this.name = "SDKValidationError";
    this.cause = cause;
    this.rawValue = rawValue;
    this.rawMessage = message;
  }
  /**
   * Return a pretty-formatted error message if the underlying validation error
   * is a ZodError or some other recognized error type, otherwise return the
   * default error message.
   */
  pretty() {
    if (this.cause instanceof $ZodError) {
      return `${this.rawMessage}
${formatZodError(this.cause)}`;
    } else {
      return this.toString();
    }
  }
};
function formatZodError(err) {
  return prettifyError(err);
}

// node_modules/@openrouter/sdk/esm/models/errors/responsevalidationerror.js
var ResponseValidationError = class extends OpenRouterError {
  constructor(message, extra) {
    super(message, extra);
    this.name = "ResponseValidationError";
    this.cause = extra.cause;
    this.rawValue = extra.rawValue;
    this.rawMessage = extra.rawMessage;
  }
  /**
   * Return a pretty-formatted error message if the underlying validation error
   * is a ZodError or some other recognized error type, otherwise return the
   * default error message.
   */
  pretty() {
    if (this.cause instanceof $ZodError) {
      return `${this.rawMessage}
${formatZodError(this.cause)}`;
    } else {
      return this.toString();
    }
  }
};

// node_modules/@openrouter/sdk/esm/lib/matchers.js
var DEFAULT_CONTENT_TYPES = {
  jsonl: "application/jsonl",
  json: "application/json",
  text: "text/plain",
  bytes: "application/octet-stream",
  stream: "application/octet-stream",
  sse: "text/event-stream",
  nil: "*",
  fail: "*"
};
function jsonErr(codes, schema, options) {
  return { ...options, err: true, enc: "json", codes, schema };
}
function json(codes, schema, options) {
  return { ...options, enc: "json", codes, schema };
}
function text(codes, schema, options) {
  return { ...options, enc: "text", codes, schema };
}
function sse(codes, schema, options) {
  return { ...options, enc: "sse", codes, schema };
}
function fail(codes) {
  return { enc: "fail", codes };
}
function match(...matchers) {
  return async function matchFunc(response, request, options) {
    let raw;
    let matcher;
    for (const match2 of matchers) {
      const { codes } = match2;
      const ctpattern = "ctype" in match2 ? match2.ctype : DEFAULT_CONTENT_TYPES[match2.enc];
      if (ctpattern && matchResponse(response, codes, ctpattern)) {
        matcher = match2;
        break;
      } else if (!ctpattern && matchStatusCode(response, codes)) {
        matcher = match2;
        break;
      }
    }
    if (!matcher) {
      return [{
        ok: false,
        error: new OpenRouterDefaultError("Unexpected Status or Content-Type", {
          response,
          request,
          body: await response.text().catch(() => "")
        })
      }, raw];
    }
    const encoding = matcher.enc;
    let body = "";
    switch (encoding) {
      case "json":
        body = await response.text();
        raw = JSON.parse(body);
        break;
      case "jsonl":
        raw = response.body;
        break;
      case "bytes":
        raw = new Uint8Array(await response.arrayBuffer());
        break;
      case "stream":
        raw = response.body;
        break;
      case "text":
        body = await response.text();
        raw = body;
        break;
      case "sse":
        raw = response.body;
        break;
      case "nil":
        body = await response.text();
        raw = void 0;
        break;
      case "fail":
        body = await response.text();
        raw = body;
        break;
      default:
        encoding;
        throw new Error(`Unsupported response type: ${encoding}`);
    }
    if (matcher.enc === "fail") {
      return [{
        ok: false,
        error: new OpenRouterDefaultError("API error occurred", {
          request,
          response,
          body
        })
      }, raw];
    }
    const resultKey = matcher.key || (options == null ? void 0 : options.resultKey);
    let data;
    if ("err" in matcher) {
      data = {
        ...options == null ? void 0 : options.extraFields,
        ...matcher.hdrs ? { Headers: unpackHeaders(response.headers) } : null,
        ...isPlainObject2(raw) ? raw : null,
        request$: request,
        response$: response,
        body$: body
      };
    } else if (resultKey) {
      data = {
        ...options == null ? void 0 : options.extraFields,
        ...matcher.hdrs ? { Headers: unpackHeaders(response.headers) } : null,
        [resultKey]: raw
      };
    } else if (matcher.hdrs) {
      data = {
        ...options == null ? void 0 : options.extraFields,
        ...matcher.hdrs ? { Headers: unpackHeaders(response.headers) } : null,
        ...isPlainObject2(raw) ? raw : null
      };
    } else {
      data = raw;
    }
    if ("err" in matcher) {
      const result = safeParseResponse(data, (v) => matcher.schema.parse(v), "Response validation failed", { request, response, body });
      return [result.ok ? { ok: false, error: result.value } : result, raw];
    } else {
      return [
        safeParseResponse(data, (v) => matcher.schema.parse(v), "Response validation failed", { request, response, body }),
        raw
      ];
    }
  };
}
var headerValRE = /, */;
function unpackHeaders(headers) {
  const out = {};
  for (const [k, v] of headers.entries()) {
    out[k] = v.split(headerValRE);
  }
  return out;
}
function safeParseResponse(rawValue, fn, errorMessage, httpMeta) {
  try {
    return OK(fn(rawValue));
  } catch (err) {
    return ERR(new ResponseValidationError(errorMessage, {
      cause: err,
      rawValue,
      rawMessage: errorMessage,
      ...httpMeta
    }));
  }
}

// node_modules/@openrouter/sdk/esm/lib/primitives.js
function remap(inp, mappings) {
  let out = {};
  if (!Object.keys(mappings).length) {
    out = inp;
    return out;
  }
  for (const [k, v] of Object.entries(inp)) {
    const j = mappings[k];
    if (j === null) {
      continue;
    }
    out[j ?? k] = v;
  }
  return out;
}
function compactMap(values) {
  const out = {};
  for (const [k, v] of Object.entries(values)) {
    if (typeof v !== "undefined") {
      out[k] = v;
    }
  }
  return out;
}

// node_modules/@openrouter/sdk/esm/lib/schemas.js
function safeParse3(rawValue, fn, errorMessage) {
  try {
    return OK(fn(rawValue));
  } catch (err) {
    return ERR(new SDKValidationError(errorMessage, err, rawValue));
  }
}

// node_modules/@openrouter/sdk/esm/lib/security.js
var SecurityErrorCode;
(function(SecurityErrorCode2) {
  SecurityErrorCode2["Incomplete"] = "incomplete";
  SecurityErrorCode2["UnrecognisedSecurityType"] = "unrecognized_security_type";
})(SecurityErrorCode || (SecurityErrorCode = {}));
var SecurityError = class _SecurityError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "SecurityError";
  }
  static incomplete() {
    return new _SecurityError(SecurityErrorCode.Incomplete, "Security requirements not met in order to perform the operation");
  }
  static unrecognizedType(type) {
    return new _SecurityError(SecurityErrorCode.UnrecognisedSecurityType, `Unrecognised security type: ${type}`);
  }
};
function resolveSecurity(...options) {
  const state = {
    basic: {},
    headers: {},
    queryParams: {},
    cookies: {},
    oauth2: { type: "none" }
  };
  const option = options.find((opts) => {
    return opts.every((o) => {
      if (o.value == null) {
        return false;
      } else if (o.type === "http:basic") {
        return o.value.username != null || o.value.password != null;
      } else if (o.type === "http:custom") {
        return null;
      } else if (o.type === "oauth2:password") {
        return typeof o.value === "string" && !!o.value;
      } else if (o.type === "oauth2:client_credentials") {
        if (typeof o.value == "string") {
          return !!o.value;
        }
        return o.value.clientID != null || o.value.clientSecret != null;
      } else if (typeof o.value === "string") {
        return !!o.value;
      } else {
        throw new Error(`Unrecognized security type: ${o.type} (value type: ${typeof o.value})`);
      }
    });
  });
  if (option == null) {
    return null;
  }
  option.forEach((spec) => {
    if (spec.value == null) {
      return;
    }
    const { type } = spec;
    switch (type) {
      case "apiKey:header":
        state.headers[spec.fieldName] = spec.value;
        break;
      case "apiKey:query":
        state.queryParams[spec.fieldName] = spec.value;
        break;
      case "apiKey:cookie":
        state.cookies[spec.fieldName] = spec.value;
        break;
      case "http:basic":
        applyBasic(state, spec);
        break;
      case "http:custom":
        break;
      case "http:bearer":
        applyBearer(state, spec);
        break;
      case "oauth2":
        applyBearer(state, spec);
        break;
      case "oauth2:password":
        applyBearer(state, spec);
        break;
      case "oauth2:client_credentials":
        break;
      case "openIdConnect":
        applyBearer(state, spec);
        break;
      default:
        spec;
        throw SecurityError.unrecognizedType(type);
    }
  });
  return state;
}
function applyBasic(state, spec) {
  if (spec.value == null) {
    return;
  }
  state.basic = spec.value;
}
function applyBearer(state, spec) {
  if (typeof spec.value !== "string" || !spec.value) {
    return;
  }
  let value = spec.value;
  if (value.slice(0, 7).toLowerCase() !== "bearer ") {
    value = `Bearer ${value}`;
  }
  if (spec.fieldName !== void 0) {
    state.headers[spec.fieldName] = value;
  }
}
function resolveGlobalSecurity(security) {
  return resolveSecurity([
    {
      fieldName: "Authorization",
      type: "http:bearer",
      value: (security == null ? void 0 : security.apiKey) ?? env().OPENROUTER_API_KEY
    }
  ]);
}
async function extractSecurity(sec) {
  if (sec == null) {
    return;
  }
  return typeof sec === "function" ? sec() : sec;
}

// node_modules/@openrouter/sdk/esm/models/activityitem.js
var ActivityItem$inboundSchema = object({
  date: string2(),
  model: string2(),
  model_permaslug: string2(),
  endpoint_id: string2(),
  provider_name: string2(),
  usage: number2(),
  byok_usage_inference: number2(),
  requests: number2(),
  prompt_tokens: number2(),
  completion_tokens: number2(),
  reasoning_tokens: number2()
}).transform((v) => {
  return remap(v, {
    "model_permaslug": "modelPermaslug",
    "endpoint_id": "endpointId",
    "provider_name": "providerName",
    "byok_usage_inference": "byokUsageInference",
    "prompt_tokens": "promptTokens",
    "completion_tokens": "completionTokens",
    "reasoning_tokens": "reasoningTokens"
  });
});

// node_modules/@openrouter/sdk/esm/types/enums.js
function catchUnrecognizedEnum(value) {
  return value;
}

// node_modules/@openrouter/sdk/esm/models/chatmessagecontentitemaudio.js
var ChatMessageContentItemAudioFormat = {
  Wav: "wav",
  Mp3: "mp3",
  Flac: "flac",
  M4a: "m4a",
  Ogg: "ogg",
  Pcm16: "pcm16",
  Pcm24: "pcm24"
};
var ChatMessageContentItemAudioFormat$inboundSchema = union([
  _enum(ChatMessageContentItemAudioFormat),
  string2().transform(catchUnrecognizedEnum)
]);
var ChatMessageContentItemAudioFormat$outboundSchema = union([
  _enum(ChatMessageContentItemAudioFormat),
  string2().and(custom())
]);
var ChatMessageContentItemAudioInputAudio$inboundSchema = object({
  data: string2(),
  format: ChatMessageContentItemAudioFormat$inboundSchema
});
var ChatMessageContentItemAudioInputAudio$outboundSchema = object({
  data: string2(),
  format: ChatMessageContentItemAudioFormat$outboundSchema
});
var ChatMessageContentItemAudio$inboundSchema = object({
  type: literal("input_audio"),
  input_audio: lazy(() => ChatMessageContentItemAudioInputAudio$inboundSchema)
}).transform((v) => {
  return remap(v, {
    "input_audio": "inputAudio"
  });
});
var ChatMessageContentItemAudio$outboundSchema = object({
  type: literal("input_audio"),
  inputAudio: lazy(() => ChatMessageContentItemAudioInputAudio$outboundSchema)
}).transform((v) => {
  return remap(v, {
    inputAudio: "input_audio"
  });
});

// node_modules/@openrouter/sdk/esm/models/chatmessagecontentitemimage.js
var ChatMessageContentItemImageDetail = {
  Auto: "auto",
  Low: "low",
  High: "high"
};
var ChatMessageContentItemImageDetail$inboundSchema = union([
  _enum(ChatMessageContentItemImageDetail),
  string2().transform(catchUnrecognizedEnum)
]);
var ChatMessageContentItemImageDetail$outboundSchema = union([
  _enum(ChatMessageContentItemImageDetail),
  string2().and(custom())
]);
var ImageUrl$inboundSchema = object({
  url: string2(),
  detail: ChatMessageContentItemImageDetail$inboundSchema.optional()
});
var ImageUrl$outboundSchema = object({
  url: string2(),
  detail: ChatMessageContentItemImageDetail$outboundSchema.optional()
});
var ChatMessageContentItemImage$inboundSchema = object({
  type: literal("image_url"),
  image_url: lazy(() => ImageUrl$inboundSchema)
}).transform((v) => {
  return remap(v, {
    "image_url": "imageUrl"
  });
});
var ChatMessageContentItemImage$outboundSchema = object({
  type: literal("image_url"),
  imageUrl: lazy(() => ImageUrl$outboundSchema)
}).transform((v) => {
  return remap(v, {
    imageUrl: "image_url"
  });
});

// node_modules/@openrouter/sdk/esm/models/chatmessagecontentitemtext.js
var ChatMessageContentItemText$inboundSchema = object({
  type: literal("text"),
  text: string2()
});
var ChatMessageContentItemText$outboundSchema = object({
  type: literal("text"),
  text: string2()
});

// node_modules/@openrouter/sdk/esm/models/chatmessagecontentitemvideo.js
var VideoUrl$inboundSchema = object({
  url: string2()
});
var VideoUrl$outboundSchema = object({
  url: string2()
});
var ChatMessageContentItemVideo$inboundSchema = object({
  type: literal("input_video"),
  video_url: lazy(() => VideoUrl$inboundSchema)
}).transform((v) => {
  return remap(v, {
    "video_url": "videoUrl"
  });
});
var ChatMessageContentItemVideo$outboundSchema = object({
  type: literal("input_video"),
  videoUrl: lazy(() => VideoUrl$outboundSchema)
}).transform((v) => {
  return remap(v, {
    videoUrl: "video_url"
  });
});

// node_modules/@openrouter/sdk/esm/models/chatmessagecontentitem.js
var ChatMessageContentItem$inboundSchema = union([
  ChatMessageContentItemText$inboundSchema.and(object({ type: literal("text") })),
  ChatMessageContentItemImage$inboundSchema.and(object({ type: literal("image_url") })),
  ChatMessageContentItemAudio$inboundSchema.and(object({ type: literal("input_audio") })),
  ChatMessageContentItemVideo$inboundSchema.and(object({ type: literal("input_video") }))
]);
var ChatMessageContentItem$outboundSchema = union([
  ChatMessageContentItemText$outboundSchema.and(object({ type: literal("text") })),
  ChatMessageContentItemImage$outboundSchema.and(object({ type: literal("image_url") })),
  ChatMessageContentItemAudio$outboundSchema.and(object({ type: literal("input_audio") })),
  ChatMessageContentItemVideo$outboundSchema.and(object({ type: literal("input_video") }))
]);

// node_modules/@openrouter/sdk/esm/models/chatmessagetoolcall.js
var ChatMessageToolCallFunction$inboundSchema = object({
  name: string2(),
  arguments: string2()
});
var ChatMessageToolCallFunction$outboundSchema = object({
  name: string2(),
  arguments: string2()
});
var ChatMessageToolCall$inboundSchema = object({
  id: string2(),
  type: literal("function"),
  function: lazy(() => ChatMessageToolCallFunction$inboundSchema)
});
var ChatMessageToolCall$outboundSchema = object({
  id: string2(),
  type: literal("function"),
  function: lazy(() => ChatMessageToolCallFunction$outboundSchema)
});

// node_modules/@openrouter/sdk/esm/models/assistantmessage.js
var AssistantMessageContent$inboundSchema = union([string2(), array(ChatMessageContentItem$inboundSchema)]);
var AssistantMessageContent$outboundSchema = union([string2(), array(ChatMessageContentItem$outboundSchema)]);
var AssistantMessage$inboundSchema = object({
  role: literal("assistant"),
  content: nullable(union([string2(), array(ChatMessageContentItem$inboundSchema)])).optional(),
  name: string2().optional(),
  tool_calls: array(ChatMessageToolCall$inboundSchema).optional(),
  refusal: nullable(string2()).optional(),
  reasoning: nullable(string2()).optional()
}).transform((v) => {
  return remap(v, {
    "tool_calls": "toolCalls"
  });
});
var AssistantMessage$outboundSchema = object({
  role: literal("assistant"),
  content: nullable(union([string2(), array(ChatMessageContentItem$outboundSchema)])).optional(),
  name: string2().optional(),
  toolCalls: array(ChatMessageToolCall$outboundSchema).optional(),
  refusal: nullable(string2()).optional(),
  reasoning: nullable(string2()).optional()
}).transform((v) => {
  return remap(v, {
    toolCalls: "tool_calls"
  });
});

// node_modules/@openrouter/sdk/esm/models/badgatewayresponseerrordata.js
var BadGatewayResponseErrorData$inboundSchema = object({
  code: int(),
  message: string2(),
  metadata: nullable(record(string2(), nullable(any()))).optional()
});

// node_modules/@openrouter/sdk/esm/models/badrequestresponseerrordata.js
var BadRequestResponseErrorData$inboundSchema = object({
  code: int(),
  message: string2(),
  metadata: nullable(record(string2(), nullable(any()))).optional()
});

// node_modules/@openrouter/sdk/esm/models/chatcompletionfinishreason.js
var ChatCompletionFinishReason = {
  ToolCalls: "tool_calls",
  Stop: "stop",
  Length: "length",
  ContentFilter: "content_filter",
  Error: "error"
};
var ChatCompletionFinishReason$inboundSchema = union([
  _enum(ChatCompletionFinishReason),
  string2().transform(catchUnrecognizedEnum)
]);

// node_modules/@openrouter/sdk/esm/models/chaterror.js
var Code$inboundSchema = union([
  string2(),
  number2()
]);
var ChatErrorError$inboundSchema = object({
  code: nullable(union([string2(), number2()])),
  message: string2(),
  param: nullable(string2()).optional(),
  type: nullable(string2()).optional()
});

// node_modules/@openrouter/sdk/esm/models/chatstreamoptions.js
var ChatStreamOptions$outboundSchema = object({
  includeUsage: boolean2().optional()
}).transform((v) => {
  return remap(v, {
    includeUsage: "include_usage"
  });
});

// node_modules/@openrouter/sdk/esm/models/systemmessage.js
var SystemMessageContent$outboundSchema = union([string2(), array(ChatMessageContentItemText$outboundSchema)]);
var SystemMessage$outboundSchema = object({
  role: literal("system"),
  content: union([
    string2(),
    array(ChatMessageContentItemText$outboundSchema)
  ]),
  name: string2().optional()
});

// node_modules/@openrouter/sdk/esm/models/toolresponsemessage.js
var ToolResponseMessageContent$outboundSchema = union([string2(), array(ChatMessageContentItem$outboundSchema)]);
var ToolResponseMessage$outboundSchema = object({
  role: literal("tool"),
  content: union([
    string2(),
    array(ChatMessageContentItem$outboundSchema)
  ]),
  toolCallId: string2()
}).transform((v) => {
  return remap(v, {
    toolCallId: "tool_call_id"
  });
});

// node_modules/@openrouter/sdk/esm/models/usermessage.js
var UserMessageContent$outboundSchema = union([string2(), array(ChatMessageContentItem$outboundSchema)]);
var UserMessage$outboundSchema = object({
  role: literal("user"),
  content: union([
    string2(),
    array(ChatMessageContentItem$outboundSchema)
  ]),
  name: string2().optional()
});

// node_modules/@openrouter/sdk/esm/models/message.js
var MessageContent$outboundSchema = union([string2(), array(ChatMessageContentItemText$outboundSchema)]);
var MessageDeveloper$outboundSchema = object({
  role: literal("developer"),
  content: union([
    string2(),
    array(ChatMessageContentItemText$outboundSchema)
  ]),
  name: string2().optional()
});
var Message$outboundSchema = union([
  ToolResponseMessage$outboundSchema,
  SystemMessage$outboundSchema,
  UserMessage$outboundSchema,
  lazy(() => MessageDeveloper$outboundSchema),
  AssistantMessage$outboundSchema
]);

// node_modules/@openrouter/sdk/esm/models/reasoningsummaryverbosity.js
var ReasoningSummaryVerbosity = {
  Auto: "auto",
  Concise: "concise",
  Detailed: "detailed"
};
var ReasoningSummaryVerbosity$inboundSchema = union([
  _enum(ReasoningSummaryVerbosity),
  string2().transform(catchUnrecognizedEnum)
]);
var ReasoningSummaryVerbosity$outboundSchema = union([
  _enum(ReasoningSummaryVerbosity),
  string2().and(custom())
]);

// node_modules/@openrouter/sdk/esm/models/jsonschemaconfig.js
var JSONSchemaConfig$outboundSchema = object({
  name: string2(),
  description: string2().optional(),
  schema: record(string2(), any()).optional(),
  strict: nullable(boolean2()).optional()
});

// node_modules/@openrouter/sdk/esm/models/responseformatjsonschema.js
var ResponseFormatJSONSchema$outboundSchema = object({
  type: literal("json_schema"),
  jsonSchema: JSONSchemaConfig$outboundSchema
}).transform((v) => {
  return remap(v, {
    jsonSchema: "json_schema"
  });
});

// node_modules/@openrouter/sdk/esm/models/responseformattextgrammar.js
var ResponseFormatTextGrammar$outboundSchema = object({
  type: literal("grammar"),
  grammar: string2()
});

// node_modules/@openrouter/sdk/esm/models/tooldefinitionjson.js
var ToolDefinitionJsonFunction$outboundSchema = object({
  name: string2(),
  description: string2().optional(),
  parameters: record(string2(), any()).optional(),
  strict: nullable(boolean2()).optional()
});
var ToolDefinitionJson$outboundSchema = object({
  type: literal("function"),
  function: lazy(() => ToolDefinitionJsonFunction$outboundSchema)
});

// node_modules/@openrouter/sdk/esm/models/chatgenerationparams.js
var Effort = {
  Minimal: "minimal",
  Low: "low",
  Medium: "medium",
  High: "high"
};
var Effort$outboundSchema = union([
  _enum(Effort),
  string2().and(custom())
]);
var Reasoning$outboundSchema = object({
  effort: nullable(Effort$outboundSchema).optional(),
  summary: nullable(ReasoningSummaryVerbosity$outboundSchema).optional()
});
var ChatGenerationParamsResponseFormatPython$outboundSchema = object({
  type: literal("python")
});
var ChatGenerationParamsResponseFormatJSONObject$outboundSchema = object({
  type: literal("json_object")
});
var ChatGenerationParamsResponseFormatText$outboundSchema = object({
  type: literal("text")
});
var ChatGenerationParamsResponseFormatUnion$outboundSchema = union([
  ResponseFormatJSONSchema$outboundSchema,
  ResponseFormatTextGrammar$outboundSchema,
  lazy(() => ChatGenerationParamsResponseFormatText$outboundSchema),
  lazy(() => ChatGenerationParamsResponseFormatJSONObject$outboundSchema),
  lazy(() => ChatGenerationParamsResponseFormatPython$outboundSchema)
]);
var ChatGenerationParamsStop$outboundSchema = union([string2(), array(string2())]);
var ChatGenerationParams$outboundSchema = object({
  messages: array(Message$outboundSchema),
  model: string2().optional(),
  models: array(string2()).optional(),
  frequencyPenalty: nullable(number2()).optional(),
  logitBias: nullable(record(string2(), number2())).optional(),
  logprobs: nullable(boolean2()).optional(),
  topLogprobs: nullable(number2()).optional(),
  maxCompletionTokens: nullable(number2()).optional(),
  maxTokens: nullable(number2()).optional(),
  metadata: record(string2(), string2()).optional(),
  presencePenalty: nullable(number2()).optional(),
  reasoning: lazy(() => Reasoning$outboundSchema).optional(),
  responseFormat: union([
    ResponseFormatJSONSchema$outboundSchema,
    ResponseFormatTextGrammar$outboundSchema,
    lazy(() => ChatGenerationParamsResponseFormatText$outboundSchema),
    lazy(() => ChatGenerationParamsResponseFormatJSONObject$outboundSchema),
    lazy(() => ChatGenerationParamsResponseFormatPython$outboundSchema)
  ]).optional(),
  seed: nullable(int()).optional(),
  stop: nullable(union([string2(), array(string2())])).optional(),
  stream: boolean2().default(false),
  streamOptions: nullable(ChatStreamOptions$outboundSchema).optional(),
  temperature: nullable(number2()).optional(),
  toolChoice: any().optional(),
  tools: array(ToolDefinitionJson$outboundSchema).optional(),
  topP: nullable(number2()).optional(),
  user: string2().optional()
}).transform((v) => {
  return remap(v, {
    frequencyPenalty: "frequency_penalty",
    logitBias: "logit_bias",
    topLogprobs: "top_logprobs",
    maxCompletionTokens: "max_completion_tokens",
    maxTokens: "max_tokens",
    presencePenalty: "presence_penalty",
    responseFormat: "response_format",
    streamOptions: "stream_options",
    toolChoice: "tool_choice",
    topP: "top_p"
  });
});

// node_modules/@openrouter/sdk/esm/models/chatgenerationtokenusage.js
var CompletionTokensDetails$inboundSchema = object({
  reasoning_tokens: nullable(number2()).optional(),
  audio_tokens: nullable(number2()).optional(),
  accepted_prediction_tokens: nullable(number2()).optional(),
  rejected_prediction_tokens: nullable(number2()).optional()
}).transform((v) => {
  return remap(v, {
    "reasoning_tokens": "reasoningTokens",
    "audio_tokens": "audioTokens",
    "accepted_prediction_tokens": "acceptedPredictionTokens",
    "rejected_prediction_tokens": "rejectedPredictionTokens"
  });
});
var PromptTokensDetails$inboundSchema = object({
  cached_tokens: number2().optional(),
  audio_tokens: number2().optional(),
  video_tokens: number2().optional()
}).transform((v) => {
  return remap(v, {
    "cached_tokens": "cachedTokens",
    "audio_tokens": "audioTokens",
    "video_tokens": "videoTokens"
  });
});
var ChatGenerationTokenUsage$inboundSchema = object({
  completion_tokens: number2(),
  prompt_tokens: number2(),
  total_tokens: number2(),
  completion_tokens_details: nullable(lazy(() => CompletionTokensDetails$inboundSchema)).optional(),
  prompt_tokens_details: nullable(lazy(() => PromptTokensDetails$inboundSchema)).optional()
}).transform((v) => {
  return remap(v, {
    "completion_tokens": "completionTokens",
    "prompt_tokens": "promptTokens",
    "total_tokens": "totalTokens",
    "completion_tokens_details": "completionTokensDetails",
    "prompt_tokens_details": "promptTokensDetails"
  });
});

// node_modules/@openrouter/sdk/esm/models/chatmessagetokenlogprob.js
var TopLogprob$inboundSchema = object({
  token: string2(),
  logprob: number2(),
  bytes: nullable(array(number2()))
});
var ChatMessageTokenLogprob$inboundSchema = object({
  token: string2(),
  logprob: number2(),
  bytes: nullable(array(number2())),
  top_logprobs: array(lazy(() => TopLogprob$inboundSchema))
}).transform((v) => {
  return remap(v, {
    "top_logprobs": "topLogprobs"
  });
});

// node_modules/@openrouter/sdk/esm/models/chatmessagetokenlogprobs.js
var ChatMessageTokenLogprobs$inboundSchema = object({
  content: nullable(array(ChatMessageTokenLogprob$inboundSchema)),
  refusal: nullable(array(ChatMessageTokenLogprob$inboundSchema))
});

// node_modules/@openrouter/sdk/esm/models/chatresponsechoice.js
var ChatResponseChoice$inboundSchema = object({
  finish_reason: nullable(ChatCompletionFinishReason$inboundSchema),
  index: number2(),
  message: AssistantMessage$inboundSchema,
  logprobs: nullable(ChatMessageTokenLogprobs$inboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    "finish_reason": "finishReason"
  });
});

// node_modules/@openrouter/sdk/esm/models/chatresponse.js
var ChatResponse$inboundSchema = object({
  id: string2(),
  choices: array(ChatResponseChoice$inboundSchema),
  created: number2(),
  model: string2(),
  object: literal("chat.completion"),
  system_fingerprint: nullable(string2()).optional(),
  usage: ChatGenerationTokenUsage$inboundSchema.optional()
}).transform((v) => {
  return remap(v, {
    "system_fingerprint": "systemFingerprint"
  });
});

// node_modules/@openrouter/sdk/esm/models/chatstreamingmessagetoolcall.js
var ChatStreamingMessageToolCallFunction$inboundSchema = object({
  name: string2().optional(),
  arguments: string2().optional()
});
var ChatStreamingMessageToolCall$inboundSchema = object({
  index: number2(),
  id: string2().optional(),
  type: literal("function").optional(),
  function: lazy(() => ChatStreamingMessageToolCallFunction$inboundSchema).optional()
});

// node_modules/@openrouter/sdk/esm/models/chatstreamingmessagechunk.js
var ChatStreamingMessageChunkRole = {
  Assistant: "assistant"
};
var ChatStreamingMessageChunkRole$inboundSchema = _enum(ChatStreamingMessageChunkRole);
var ChatStreamingMessageChunk$inboundSchema = object({
  role: ChatStreamingMessageChunkRole$inboundSchema.optional(),
  content: nullable(string2()).optional(),
  reasoning: nullable(string2()).optional(),
  refusal: nullable(string2()).optional(),
  tool_calls: array(ChatStreamingMessageToolCall$inboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    "tool_calls": "toolCalls"
  });
});

// node_modules/@openrouter/sdk/esm/models/chatstreamingchoice.js
var ChatStreamingChoice$inboundSchema = object({
  delta: ChatStreamingMessageChunk$inboundSchema,
  finish_reason: nullable(ChatCompletionFinishReason$inboundSchema),
  index: number2(),
  logprobs: nullable(ChatMessageTokenLogprobs$inboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    "finish_reason": "finishReason"
  });
});

// node_modules/@openrouter/sdk/esm/models/chatstreamingresponsechunk.js
var ChatStreamingResponseChunkError$inboundSchema = object({
  message: string2(),
  code: number2()
});
var ChatStreamingResponseChunkData$inboundSchema = object({
  id: string2(),
  choices: array(ChatStreamingChoice$inboundSchema),
  created: number2(),
  model: string2(),
  object: literal("chat.completion.chunk"),
  system_fingerprint: nullable(string2()).optional(),
  error: lazy(() => ChatStreamingResponseChunkError$inboundSchema).optional(),
  usage: ChatGenerationTokenUsage$inboundSchema.optional()
}).transform((v) => {
  return remap(v, {
    "system_fingerprint": "systemFingerprint"
  });
});
var ChatStreamingResponseChunk$inboundSchema = object({
  data: string2().transform((v, ctx) => {
    try {
      return JSON.parse(v);
    } catch (err) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: `malformed json: ${err}`
      });
      return NEVER;
    }
  }).pipe(lazy(() => ChatStreamingResponseChunkData$inboundSchema))
});

// node_modules/@openrouter/sdk/esm/models/completionlogprobs.js
var CompletionLogprobs$inboundSchema = object({
  tokens: array(string2()),
  token_logprobs: array(number2()),
  top_logprobs: nullable(array(record(string2(), number2()))),
  text_offset: array(number2())
}).transform((v) => {
  return remap(v, {
    "token_logprobs": "tokenLogprobs",
    "top_logprobs": "topLogprobs",
    "text_offset": "textOffset"
  });
});

// node_modules/@openrouter/sdk/esm/models/completionchoice.js
var CompletionFinishReason = {
  Stop: "stop",
  Length: "length",
  ContentFilter: "content_filter"
};
var CompletionFinishReason$inboundSchema = union([
  _enum(CompletionFinishReason),
  string2().transform(catchUnrecognizedEnum)
]);
var CompletionChoice$inboundSchema = object({
  text: string2(),
  index: number2(),
  logprobs: nullable(CompletionLogprobs$inboundSchema),
  finish_reason: nullable(CompletionFinishReason$inboundSchema)
}).transform((v) => {
  return remap(v, {
    "finish_reason": "finishReason"
  });
});

// node_modules/@openrouter/sdk/esm/models/completioncreateparams.js
var Prompt$outboundSchema = union([
  string2(),
  array(string2()),
  array(number2()),
  array(array(number2()))
]);
var CompletionCreateParamsStop$outboundSchema = union([string2(), array(string2())]);
var StreamOptions$outboundSchema = object({
  includeUsage: nullable(boolean2()).optional()
}).transform((v) => {
  return remap(v, {
    includeUsage: "include_usage"
  });
});
var CompletionCreateParamsResponseFormatPython$outboundSchema = object({
  type: literal("python")
});
var CompletionCreateParamsResponseFormatJSONObject$outboundSchema = object({
  type: literal("json_object")
});
var CompletionCreateParamsResponseFormatText$outboundSchema = object({
  type: literal("text")
});
var CompletionCreateParamsResponseFormatUnion$outboundSchema = union([
  ResponseFormatJSONSchema$outboundSchema,
  ResponseFormatTextGrammar$outboundSchema,
  lazy(() => CompletionCreateParamsResponseFormatText$outboundSchema),
  lazy(() => CompletionCreateParamsResponseFormatJSONObject$outboundSchema),
  lazy(() => CompletionCreateParamsResponseFormatPython$outboundSchema)
]);
var CompletionCreateParams$outboundSchema = object({
  model: string2().optional(),
  models: array(string2()).optional(),
  prompt: union([
    string2(),
    array(string2()),
    array(number2()),
    array(array(number2()))
  ]),
  bestOf: nullable(int()).optional(),
  echo: nullable(boolean2()).optional(),
  frequencyPenalty: nullable(number2()).optional(),
  logitBias: nullable(record(string2(), number2())).optional(),
  logprobs: nullable(int()).optional(),
  maxTokens: nullable(int()).optional(),
  n: nullable(int()).optional(),
  presencePenalty: nullable(number2()).optional(),
  seed: nullable(int()).optional(),
  stop: nullable(union([string2(), array(string2())])).optional(),
  stream: boolean2().default(false),
  streamOptions: nullable(lazy(() => StreamOptions$outboundSchema)).optional(),
  suffix: nullable(string2()).optional(),
  temperature: nullable(number2()).optional(),
  topP: nullable(number2()).optional(),
  user: string2().optional(),
  metadata: nullable(record(string2(), string2())).optional(),
  responseFormat: nullable(union([
    ResponseFormatJSONSchema$outboundSchema,
    ResponseFormatTextGrammar$outboundSchema,
    lazy(() => CompletionCreateParamsResponseFormatText$outboundSchema),
    lazy(() => CompletionCreateParamsResponseFormatJSONObject$outboundSchema),
    lazy(() => CompletionCreateParamsResponseFormatPython$outboundSchema)
  ])).optional()
}).transform((v) => {
  return remap(v, {
    bestOf: "best_of",
    frequencyPenalty: "frequency_penalty",
    logitBias: "logit_bias",
    maxTokens: "max_tokens",
    presencePenalty: "presence_penalty",
    streamOptions: "stream_options",
    topP: "top_p",
    responseFormat: "response_format"
  });
});

// node_modules/@openrouter/sdk/esm/models/completionusage.js
var CompletionUsage$inboundSchema = object({
  prompt_tokens: number2(),
  completion_tokens: number2(),
  total_tokens: number2()
}).transform((v) => {
  return remap(v, {
    "prompt_tokens": "promptTokens",
    "completion_tokens": "completionTokens",
    "total_tokens": "totalTokens"
  });
});

// node_modules/@openrouter/sdk/esm/models/completionresponse.js
var CompletionResponse$inboundSchema = object({
  id: string2(),
  object: literal("text_completion"),
  created: number2(),
  model: string2(),
  system_fingerprint: string2().optional(),
  choices: array(CompletionChoice$inboundSchema),
  usage: CompletionUsage$inboundSchema.optional()
}).transform((v) => {
  return remap(v, {
    "system_fingerprint": "systemFingerprint"
  });
});

// node_modules/@openrouter/sdk/esm/models/createchargerequest.js
var ChainId = {
  One: 1,
  OneHundredAndThirtySeven: 137,
  EightThousandFourHundredAndFiftyThree: 8453
};
var ChainId$outboundSchema = union([
  _enum(ChainId),
  number2().and(custom())
]);
var CreateChargeRequest$outboundSchema = object({
  amount: number2(),
  sender: string2(),
  chainId: ChainId$outboundSchema
}).transform((v) => {
  return remap(v, {
    chainId: "chain_id"
  });
});

// node_modules/@openrouter/sdk/esm/models/defaultparameters.js
var DefaultParameters$inboundSchema = object({
  temperature: nullable(number2()).optional(),
  top_p: nullable(number2()).optional(),
  frequency_penalty: nullable(number2()).optional()
}).transform((v) => {
  return remap(v, {
    "top_p": "topP",
    "frequency_penalty": "frequencyPenalty"
  });
});

// node_modules/@openrouter/sdk/esm/models/edgenetworktimeoutresponseerrordata.js
var EdgeNetworkTimeoutResponseErrorData$inboundSchema = object({
  code: int(),
  message: string2(),
  metadata: nullable(record(string2(), nullable(any()))).optional()
});

// node_modules/@openrouter/sdk/esm/models/endpointstatus.js
var EndpointStatus = {
  Zero: 0,
  Minus1: -1,
  Minus2: -2,
  Minus3: -3,
  Minus5: -5,
  Minus10: -10
};
var EndpointStatus$inboundSchema = union([
  _enum(EndpointStatus),
  number2().transform(catchUnrecognizedEnum)
]);

// node_modules/@openrouter/sdk/esm/models/filecitation.js
var FileCitationType = {
  FileCitation: "file_citation"
};
var FileCitationType$inboundSchema = _enum(FileCitationType);
var FileCitationType$outboundSchema = FileCitationType$inboundSchema;
var FileCitation$inboundSchema = object({
  type: FileCitationType$inboundSchema,
  file_id: string2(),
  filename: string2(),
  index: number2()
}).transform((v) => {
  return remap(v, {
    "file_id": "fileId"
  });
});
var FileCitation$outboundSchema = object({
  type: FileCitationType$outboundSchema,
  fileId: string2(),
  filename: string2(),
  index: number2()
}).transform((v) => {
  return remap(v, {
    fileId: "file_id"
  });
});

// node_modules/@openrouter/sdk/esm/models/filepath.js
var FilePathType = {
  FilePath: "file_path"
};
var FilePathType$inboundSchema = _enum(FilePathType);
var FilePathType$outboundSchema = FilePathType$inboundSchema;
var FilePath$inboundSchema = object({
  type: FilePathType$inboundSchema,
  file_id: string2(),
  index: number2()
}).transform((v) => {
  return remap(v, {
    "file_id": "fileId"
  });
});
var FilePath$outboundSchema = object({
  type: FilePathType$outboundSchema,
  fileId: string2(),
  index: number2()
}).transform((v) => {
  return remap(v, {
    fileId: "file_id"
  });
});

// node_modules/@openrouter/sdk/esm/models/forbiddenresponseerrordata.js
var ForbiddenResponseErrorData$inboundSchema = object({
  code: int(),
  message: string2(),
  metadata: nullable(record(string2(), nullable(any()))).optional()
});

// node_modules/@openrouter/sdk/esm/models/imagegenerationstatus.js
var ImageGenerationStatus = {
  InProgress: "in_progress",
  Completed: "completed",
  Generating: "generating",
  Failed: "failed"
};
var ImageGenerationStatus$inboundSchema = union([
  _enum(ImageGenerationStatus),
  string2().transform(catchUnrecognizedEnum)
]);
var ImageGenerationStatus$outboundSchema = union([
  _enum(ImageGenerationStatus),
  string2().and(custom())
]);

// node_modules/@openrouter/sdk/esm/models/inputmodality.js
var InputModality = {
  Text: "text",
  Image: "image",
  File: "file",
  Audio: "audio",
  Video: "video"
};
var InputModality$inboundSchema = union([
  _enum(InputModality),
  string2().transform(catchUnrecognizedEnum)
]);

// node_modules/@openrouter/sdk/esm/models/instructtype.js
var InstructType = {
  None: "none",
  Airoboros: "airoboros",
  Alpaca: "alpaca",
  AlpacaModif: "alpaca-modif",
  Chatml: "chatml",
  Claude: "claude",
  CodeLlama: "code-llama",
  Gemma: "gemma",
  Llama2: "llama2",
  Llama3: "llama3",
  Mistral: "mistral",
  Nemotron: "nemotron",
  Neural: "neural",
  Openchat: "openchat",
  Phi3: "phi3",
  Rwkv: "rwkv",
  Vicuna: "vicuna",
  Zephyr: "zephyr",
  DeepseekR1: "deepseek-r1",
  DeepseekV31: "deepseek-v3.1",
  Qwq: "qwq",
  Qwen3: "qwen3"
};
var InstructType$inboundSchema = union([
  _enum(InstructType),
  string2().transform(catchUnrecognizedEnum)
]);

// node_modules/@openrouter/sdk/esm/models/internalserverresponseerrordata.js
var InternalServerResponseErrorData$inboundSchema = object({
  code: int(),
  message: string2(),
  metadata: nullable(record(string2(), nullable(any()))).optional()
});

// node_modules/@openrouter/sdk/esm/models/outputmodality.js
var OutputModality = {
  Text: "text",
  Image: "image",
  Embeddings: "embeddings"
};
var OutputModality$inboundSchema = union([
  _enum(OutputModality),
  string2().transform(catchUnrecognizedEnum)
]);

// node_modules/@openrouter/sdk/esm/models/parameter.js
var Parameter = {
  Temperature: "temperature",
  TopP: "top_p",
  TopK: "top_k",
  MinP: "min_p",
  TopA: "top_a",
  FrequencyPenalty: "frequency_penalty",
  PresencePenalty: "presence_penalty",
  RepetitionPenalty: "repetition_penalty",
  MaxTokens: "max_tokens",
  LogitBias: "logit_bias",
  Logprobs: "logprobs",
  TopLogprobs: "top_logprobs",
  Seed: "seed",
  ResponseFormat: "response_format",
  StructuredOutputs: "structured_outputs",
  Stop: "stop",
  Tools: "tools",
  ToolChoice: "tool_choice",
  ParallelToolCalls: "parallel_tool_calls",
  IncludeReasoning: "include_reasoning",
  Reasoning: "reasoning",
  WebSearchOptions: "web_search_options",
  Verbosity: "verbosity"
};
var Parameter$inboundSchema = union([
  _enum(Parameter),
  string2().transform(catchUnrecognizedEnum)
]);

// node_modules/@openrouter/sdk/esm/models/providername.js
var ProviderName = {
  AnyScale: "AnyScale",
  CentML: "Cent-ML",
  HuggingFace: "HuggingFace",
  Hyperbolic2: "Hyperbolic 2",
  Lepton: "Lepton",
  Lynn2: "Lynn 2",
  Lynn: "Lynn",
  Mancer: "Mancer",
  Modal: "Modal",
  OctoAI: "OctoAI",
  Recursal: "Recursal",
  Reflection: "Reflection",
  Replicate: "Replicate",
  SambaNova2: "SambaNova 2",
  SFCompute: "SF Compute",
  Together2: "Together 2",
  OneDotAI: "01.AI",
  Ai21: "AI21",
  AionLabs: "AionLabs",
  Alibaba: "Alibaba",
  AmazonBedrock: "Amazon Bedrock",
  Anthropic: "Anthropic",
  AtlasCloud: "AtlasCloud",
  Atoma: "Atoma",
  Avian: "Avian",
  Azure: "Azure",
  BaseTen: "BaseTen",
  Cerebras: "Cerebras",
  Chutes: "Chutes",
  Cirrascale: "Cirrascale",
  Clarifai: "Clarifai",
  Cloudflare: "Cloudflare",
  Cohere: "Cohere",
  CrofAI: "CrofAI",
  Crusoe: "Crusoe",
  DeepInfra: "DeepInfra",
  DeepSeek: "DeepSeek",
  Enfer: "Enfer",
  Featherless: "Featherless",
  Fireworks: "Fireworks",
  Friendli: "Friendli",
  GMICloud: "GMICloud",
  Google: "Google",
  GoogleAIStudio: "Google AI Studio",
  Groq: "Groq",
  Hyperbolic: "Hyperbolic",
  Inception: "Inception",
  InferenceNet: "InferenceNet",
  Infermatic: "Infermatic",
  Inflection: "Inflection",
  InoCloud: "InoCloud",
  Kluster: "Kluster",
  Lambda: "Lambda",
  Liquid: "Liquid",
  Mancer2: "Mancer 2",
  Meta: "Meta",
  Minimax: "Minimax",
  ModelRun: "ModelRun",
  Mistral: "Mistral",
  Modular: "Modular",
  MoonshotAI: "Moonshot AI",
  Morph: "Morph",
  NCompass: "NCompass",
  Nebius: "Nebius",
  NextBit: "NextBit",
  Nineteen: "Nineteen",
  Novita: "Novita",
  Nvidia: "Nvidia",
  OpenAI: "OpenAI",
  OpenInference: "OpenInference",
  Parasail: "Parasail",
  Perplexity: "Perplexity",
  Phala: "Phala",
  Relace: "Relace",
  SambaNova: "SambaNova",
  SiliconFlow: "SiliconFlow",
  Stealth: "Stealth",
  Switchpoint: "Switchpoint",
  Targon: "Targon",
  Together: "Together",
  Ubicloud: "Ubicloud",
  Venice: "Venice",
  WandB: "WandB",
  XAI: "xAI",
  ZAi: "Z.AI",
  FakeProvider: "FakeProvider"
};
var ProviderName$inboundSchema = union([
  _enum(ProviderName),
  string2().transform(catchUnrecognizedEnum)
]);
var ProviderName$outboundSchema = union([
  _enum(ProviderName),
  string2().and(custom())
]);

// node_modules/@openrouter/sdk/esm/models/publicendpoint.js
var PublicEndpointQuantization = {
  Int4: "int4",
  Int8: "int8",
  Fp4: "fp4",
  Fp6: "fp6",
  Fp8: "fp8",
  Fp16: "fp16",
  Bf16: "bf16",
  Fp32: "fp32",
  Unknown: "unknown"
};
var Pricing$inboundSchema = object({
  prompt: any().optional(),
  completion: any().optional(),
  request: any().optional(),
  image: any().optional(),
  image_output: any().optional(),
  audio: any().optional(),
  input_audio_cache: any().optional(),
  web_search: any().optional(),
  internal_reasoning: any().optional(),
  input_cache_read: any().optional(),
  input_cache_write: any().optional(),
  discount: number2().optional()
}).transform((v) => {
  return remap(v, {
    "image_output": "imageOutput",
    "input_audio_cache": "inputAudioCache",
    "web_search": "webSearch",
    "internal_reasoning": "internalReasoning",
    "input_cache_read": "inputCacheRead",
    "input_cache_write": "inputCacheWrite"
  });
});
var PublicEndpointQuantization$inboundSchema = union([
  _enum(PublicEndpointQuantization),
  string2().transform(catchUnrecognizedEnum)
]);
var PublicEndpoint$inboundSchema = object({
  name: string2(),
  model_name: string2(),
  context_length: number2(),
  pricing: lazy(() => Pricing$inboundSchema),
  provider_name: ProviderName$inboundSchema,
  tag: string2(),
  quantization: nullable(PublicEndpointQuantization$inboundSchema),
  max_completion_tokens: nullable(number2()),
  max_prompt_tokens: nullable(number2()),
  supported_parameters: array(Parameter$inboundSchema),
  status: EndpointStatus$inboundSchema.optional(),
  uptime_last_30m: nullable(number2()),
  supports_implicit_caching: boolean2()
}).transform((v) => {
  return remap(v, {
    "model_name": "modelName",
    "context_length": "contextLength",
    "provider_name": "providerName",
    "max_completion_tokens": "maxCompletionTokens",
    "max_prompt_tokens": "maxPromptTokens",
    "supported_parameters": "supportedParameters",
    "uptime_last_30m": "uptimeLast30m",
    "supports_implicit_caching": "supportsImplicitCaching"
  });
});

// node_modules/@openrouter/sdk/esm/models/listendpointsresponse.js
var Tokenizer = {
  Router: "Router",
  Media: "Media",
  Other: "Other",
  Gpt: "GPT",
  Claude: "Claude",
  Gemini: "Gemini",
  Grok: "Grok",
  Cohere: "Cohere",
  Nova: "Nova",
  Qwen: "Qwen",
  Yi: "Yi",
  DeepSeek: "DeepSeek",
  Mistral: "Mistral",
  Llama2: "Llama2",
  Llama3: "Llama3",
  Llama4: "Llama4",
  PaLM: "PaLM",
  Rwkv: "RWKV",
  Qwen3: "Qwen3"
};
var Tokenizer$inboundSchema = union([
  _enum(Tokenizer),
  string2().transform(catchUnrecognizedEnum)
]);
var Architecture$inboundSchema = object({
  tokenizer: nullable(Tokenizer$inboundSchema),
  instruct_type: nullable(InstructType$inboundSchema),
  modality: nullable(string2()),
  input_modalities: array(InputModality$inboundSchema),
  output_modalities: array(OutputModality$inboundSchema)
}).transform((v) => {
  return remap(v, {
    "instruct_type": "instructType",
    "input_modalities": "inputModalities",
    "output_modalities": "outputModalities"
  });
});
var ListEndpointsResponse$inboundSchema = object({
  id: string2(),
  name: string2(),
  created: number2(),
  description: string2(),
  architecture: lazy(() => Architecture$inboundSchema),
  endpoints: array(PublicEndpoint$inboundSchema)
});

// node_modules/@openrouter/sdk/esm/models/modelgroup.js
var ModelGroup = {
  Router: "Router",
  Media: "Media",
  Other: "Other",
  Gpt: "GPT",
  Claude: "Claude",
  Gemini: "Gemini",
  Grok: "Grok",
  Cohere: "Cohere",
  Nova: "Nova",
  Qwen: "Qwen",
  Yi: "Yi",
  DeepSeek: "DeepSeek",
  Mistral: "Mistral",
  Llama2: "Llama2",
  Llama3: "Llama3",
  Llama4: "Llama4",
  PaLM: "PaLM",
  Rwkv: "RWKV",
  Qwen3: "Qwen3"
};
var ModelGroup$inboundSchema = union([
  _enum(ModelGroup),
  string2().transform(catchUnrecognizedEnum)
]);

// node_modules/@openrouter/sdk/esm/models/modelarchitecture.js
var ModelArchitectureInstructType = {
  None: "none",
  Airoboros: "airoboros",
  Alpaca: "alpaca",
  AlpacaModif: "alpaca-modif",
  Chatml: "chatml",
  Claude: "claude",
  CodeLlama: "code-llama",
  Gemma: "gemma",
  Llama2: "llama2",
  Llama3: "llama3",
  Mistral: "mistral",
  Nemotron: "nemotron",
  Neural: "neural",
  Openchat: "openchat",
  Phi3: "phi3",
  Rwkv: "rwkv",
  Vicuna: "vicuna",
  Zephyr: "zephyr",
  DeepseekR1: "deepseek-r1",
  DeepseekV31: "deepseek-v3.1",
  Qwq: "qwq",
  Qwen3: "qwen3"
};
var ModelArchitectureInstructType$inboundSchema = union([
  _enum(ModelArchitectureInstructType),
  string2().transform(catchUnrecognizedEnum)
]);
var ModelArchitecture$inboundSchema = object({
  tokenizer: ModelGroup$inboundSchema.optional(),
  instruct_type: nullable(ModelArchitectureInstructType$inboundSchema).optional(),
  modality: nullable(string2()),
  input_modalities: array(InputModality$inboundSchema),
  output_modalities: array(OutputModality$inboundSchema)
}).transform((v) => {
  return remap(v, {
    "instruct_type": "instructType",
    "input_modalities": "inputModalities",
    "output_modalities": "outputModalities"
  });
});

// node_modules/@openrouter/sdk/esm/models/perrequestlimits.js
var PerRequestLimits$inboundSchema = object({
  prompt_tokens: number2(),
  completion_tokens: number2()
}).transform((v) => {
  return remap(v, {
    "prompt_tokens": "promptTokens",
    "completion_tokens": "completionTokens"
  });
});

// node_modules/@openrouter/sdk/esm/models/publicpricing.js
var PublicPricing$inboundSchema = object({
  prompt: any().optional(),
  completion: any().optional(),
  request: any().optional(),
  image: any().optional(),
  image_output: any().optional(),
  audio: any().optional(),
  input_audio_cache: any().optional(),
  web_search: any().optional(),
  internal_reasoning: any().optional(),
  input_cache_read: any().optional(),
  input_cache_write: any().optional(),
  discount: number2().optional()
}).transform((v) => {
  return remap(v, {
    "image_output": "imageOutput",
    "input_audio_cache": "inputAudioCache",
    "web_search": "webSearch",
    "internal_reasoning": "internalReasoning",
    "input_cache_read": "inputCacheRead",
    "input_cache_write": "inputCacheWrite"
  });
});

// node_modules/@openrouter/sdk/esm/models/topproviderinfo.js
var TopProviderInfo$inboundSchema = object({
  context_length: nullable(number2()).optional(),
  max_completion_tokens: nullable(number2()).optional(),
  is_moderated: boolean2()
}).transform((v) => {
  return remap(v, {
    "context_length": "contextLength",
    "max_completion_tokens": "maxCompletionTokens",
    "is_moderated": "isModerated"
  });
});

// node_modules/@openrouter/sdk/esm/models/model.js
var Model$inboundSchema = object({
  id: string2(),
  canonical_slug: string2(),
  hugging_face_id: nullable(string2()).optional(),
  name: string2(),
  created: number2(),
  description: string2().optional(),
  pricing: PublicPricing$inboundSchema,
  context_length: nullable(number2()),
  architecture: ModelArchitecture$inboundSchema,
  top_provider: TopProviderInfo$inboundSchema,
  per_request_limits: nullable(PerRequestLimits$inboundSchema),
  supported_parameters: array(Parameter$inboundSchema),
  default_parameters: nullable(DefaultParameters$inboundSchema)
}).transform((v) => {
  return remap(v, {
    "canonical_slug": "canonicalSlug",
    "hugging_face_id": "huggingFaceId",
    "context_length": "contextLength",
    "top_provider": "topProvider",
    "per_request_limits": "perRequestLimits",
    "supported_parameters": "supportedParameters",
    "default_parameters": "defaultParameters"
  });
});

// node_modules/@openrouter/sdk/esm/models/modelscountresponse.js
var ModelsCountResponseData$inboundSchema = object({
  count: number2()
});
var ModelsCountResponse$inboundSchema = object({
  data: lazy(() => ModelsCountResponseData$inboundSchema)
});

// node_modules/@openrouter/sdk/esm/models/modelslistresponse.js
var ModelsListResponse$inboundSchema = object({
  data: array(Model$inboundSchema)
});

// node_modules/@openrouter/sdk/esm/models/notfoundresponseerrordata.js
var NotFoundResponseErrorData$inboundSchema = object({
  code: int(),
  message: string2(),
  metadata: nullable(record(string2(), nullable(any()))).optional()
});

// node_modules/@openrouter/sdk/esm/models/urlcitation.js
var URLCitationType = {
  UrlCitation: "url_citation"
};
var URLCitationType$inboundSchema = _enum(URLCitationType);
var URLCitationType$outboundSchema = URLCitationType$inboundSchema;
var URLCitation$inboundSchema = object({
  type: URLCitationType$inboundSchema,
  url: string2(),
  title: string2(),
  start_index: number2(),
  end_index: number2()
}).transform((v) => {
  return remap(v, {
    "start_index": "startIndex",
    "end_index": "endIndex"
  });
});
var URLCitation$outboundSchema = object({
  type: URLCitationType$outboundSchema,
  url: string2(),
  title: string2(),
  startIndex: number2(),
  endIndex: number2()
}).transform((v) => {
  return remap(v, {
    startIndex: "start_index",
    endIndex: "end_index"
  });
});

// node_modules/@openrouter/sdk/esm/models/openairesponsesannotation.js
var OpenAIResponsesAnnotation$inboundSchema = union([
  URLCitation$inboundSchema,
  FileCitation$inboundSchema,
  FilePath$inboundSchema
]);
var OpenAIResponsesAnnotation$outboundSchema = union([
  URLCitation$outboundSchema,
  FileCitation$outboundSchema,
  FilePath$outboundSchema
]);

// node_modules/@openrouter/sdk/esm/models/openairesponsesincludable.js
var OpenAIResponsesIncludable = {
  FileSearchCallResults: "file_search_call.results",
  MessageInputImageImageUrl: "message.input_image.image_url",
  ComputerCallOutputOutputImageUrl: "computer_call_output.output.image_url",
  ReasoningEncryptedContent: "reasoning.encrypted_content",
  CodeInterpreterCallOutputs: "code_interpreter_call.outputs"
};
var OpenAIResponsesIncludable$outboundSchema = union([
  _enum(OpenAIResponsesIncludable),
  string2().and(custom())
]);

// node_modules/@openrouter/sdk/esm/models/openairesponsesincompletedetails.js
var Reason = {
  MaxOutputTokens: "max_output_tokens",
  ContentFilter: "content_filter"
};
var Reason$inboundSchema = union([
  _enum(Reason),
  string2().transform(catchUnrecognizedEnum)
]);
var OpenAIResponsesIncompleteDetails$inboundSchema = object({
  reason: Reason$inboundSchema.optional()
});

// node_modules/@openrouter/sdk/esm/models/outputitemimagegenerationcall.js
var OutputItemImageGenerationCallType = {
  ImageGenerationCall: "image_generation_call"
};
var OutputItemImageGenerationCallType$inboundSchema = _enum(OutputItemImageGenerationCallType);
var OutputItemImageGenerationCall$inboundSchema = object({
  type: OutputItemImageGenerationCallType$inboundSchema,
  id: string2(),
  result: nullable(string2()).default(null),
  status: ImageGenerationStatus$inboundSchema
});

// node_modules/@openrouter/sdk/esm/models/openairesponsesrefusalcontent.js
var OpenAIResponsesRefusalContentType = {
  Refusal: "refusal"
};
var OpenAIResponsesRefusalContentType$inboundSchema = _enum(OpenAIResponsesRefusalContentType);
var OpenAIResponsesRefusalContentType$outboundSchema = OpenAIResponsesRefusalContentType$inboundSchema;
var OpenAIResponsesRefusalContent$inboundSchema = object({
  type: OpenAIResponsesRefusalContentType$inboundSchema,
  refusal: string2()
});
var OpenAIResponsesRefusalContent$outboundSchema = object({
  type: OpenAIResponsesRefusalContentType$outboundSchema,
  refusal: string2()
});

// node_modules/@openrouter/sdk/esm/models/responseoutputtext.js
var ResponseOutputTextType = {
  OutputText: "output_text"
};
var ResponseOutputTextType$inboundSchema = _enum(ResponseOutputTextType);
var ResponseOutputTextType$outboundSchema = ResponseOutputTextType$inboundSchema;
var ResponseOutputText$inboundSchema = object({
  type: ResponseOutputTextType$inboundSchema,
  text: string2(),
  annotations: array(OpenAIResponsesAnnotation$inboundSchema).optional()
});
var ResponseOutputText$outboundSchema = object({
  type: ResponseOutputTextType$outboundSchema,
  text: string2(),
  annotations: array(OpenAIResponsesAnnotation$outboundSchema).optional()
});

// node_modules/@openrouter/sdk/esm/models/outputmessage.js
var OutputMessageRole = {
  Assistant: "assistant"
};
var OutputMessageType = {
  Message: "message"
};
var OutputMessageStatusInProgress = {
  InProgress: "in_progress"
};
var OutputMessageStatusIncomplete = {
  Incomplete: "incomplete"
};
var OutputMessageStatusCompleted = {
  Completed: "completed"
};
var OutputMessageRole$inboundSchema = _enum(OutputMessageRole);
var OutputMessageType$inboundSchema = _enum(OutputMessageType);
var OutputMessageStatusInProgress$inboundSchema = _enum(OutputMessageStatusInProgress);
var OutputMessageStatusIncomplete$inboundSchema = _enum(OutputMessageStatusIncomplete);
var OutputMessageStatusCompleted$inboundSchema = _enum(OutputMessageStatusCompleted);
var OutputMessageStatusUnion$inboundSchema = union([
  OutputMessageStatusCompleted$inboundSchema,
  OutputMessageStatusIncomplete$inboundSchema,
  OutputMessageStatusInProgress$inboundSchema
]);
var OutputMessageContent$inboundSchema = union([
  ResponseOutputText$inboundSchema,
  OpenAIResponsesRefusalContent$inboundSchema
]);
var OutputMessage$inboundSchema = object({
  id: string2(),
  role: OutputMessageRole$inboundSchema,
  type: OutputMessageType$inboundSchema,
  status: union([
    OutputMessageStatusCompleted$inboundSchema,
    OutputMessageStatusIncomplete$inboundSchema,
    OutputMessageStatusInProgress$inboundSchema
  ]).optional(),
  content: array(union([
    ResponseOutputText$inboundSchema,
    OpenAIResponsesRefusalContent$inboundSchema
  ]))
});

// node_modules/@openrouter/sdk/esm/models/responseinputaudio.js
var ResponseInputAudioType = {
  InputAudio: "input_audio"
};
var ResponseInputAudioFormat = {
  Mp3: "mp3",
  Wav: "wav"
};
var ResponseInputAudioType$inboundSchema = _enum(ResponseInputAudioType);
var ResponseInputAudioType$outboundSchema = ResponseInputAudioType$inboundSchema;
var ResponseInputAudioFormat$inboundSchema = union([
  _enum(ResponseInputAudioFormat),
  string2().transform(catchUnrecognizedEnum)
]);
var ResponseInputAudioFormat$outboundSchema = union([
  _enum(ResponseInputAudioFormat),
  string2().and(custom())
]);
var ResponseInputAudioInputAudio$inboundSchema = object({
  data: string2(),
  format: ResponseInputAudioFormat$inboundSchema
});
var ResponseInputAudioInputAudio$outboundSchema = object({
  data: string2(),
  format: ResponseInputAudioFormat$outboundSchema
});
var ResponseInputAudio$inboundSchema = object({
  type: ResponseInputAudioType$inboundSchema,
  input_audio: lazy(() => ResponseInputAudioInputAudio$inboundSchema)
}).transform((v) => {
  return remap(v, {
    "input_audio": "inputAudio"
  });
});
var ResponseInputAudio$outboundSchema = object({
  type: ResponseInputAudioType$outboundSchema,
  inputAudio: lazy(() => ResponseInputAudioInputAudio$outboundSchema)
}).transform((v) => {
  return remap(v, {
    inputAudio: "input_audio"
  });
});

// node_modules/@openrouter/sdk/esm/models/responseinputfile.js
var ResponseInputFileType = {
  InputFile: "input_file"
};
var ResponseInputFileType$inboundSchema = _enum(ResponseInputFileType);
var ResponseInputFileType$outboundSchema = ResponseInputFileType$inboundSchema;
var ResponseInputFile$inboundSchema = object({
  type: ResponseInputFileType$inboundSchema,
  file_id: nullable(string2()).optional(),
  file_data: string2().optional(),
  filename: string2().optional(),
  file_url: string2().optional()
}).transform((v) => {
  return remap(v, {
    "file_id": "fileId",
    "file_data": "fileData",
    "file_url": "fileUrl"
  });
});
var ResponseInputFile$outboundSchema = object({
  type: ResponseInputFileType$outboundSchema,
  fileId: nullable(string2()).optional(),
  fileData: string2().optional(),
  filename: string2().optional(),
  fileUrl: string2().optional()
}).transform((v) => {
  return remap(v, {
    fileId: "file_id",
    fileData: "file_data",
    fileUrl: "file_url"
  });
});

// node_modules/@openrouter/sdk/esm/models/responseinputimage.js
var ResponseInputImageType = {
  InputImage: "input_image"
};
var ResponseInputImageDetail = {
  Auto: "auto",
  High: "high",
  Low: "low"
};
var ResponseInputImageType$inboundSchema = _enum(ResponseInputImageType);
var ResponseInputImageType$outboundSchema = ResponseInputImageType$inboundSchema;
var ResponseInputImageDetail$inboundSchema = union([
  _enum(ResponseInputImageDetail),
  string2().transform(catchUnrecognizedEnum)
]);
var ResponseInputImageDetail$outboundSchema = union([
  _enum(ResponseInputImageDetail),
  string2().and(custom())
]);
var ResponseInputImage$inboundSchema = object({
  type: ResponseInputImageType$inboundSchema,
  detail: ResponseInputImageDetail$inboundSchema,
  image_url: nullable(string2()).optional()
}).transform((v) => {
  return remap(v, {
    "image_url": "imageUrl"
  });
});
var ResponseInputImage$outboundSchema = object({
  type: ResponseInputImageType$outboundSchema,
  detail: ResponseInputImageDetail$outboundSchema,
  imageUrl: nullable(string2()).optional()
}).transform((v) => {
  return remap(v, {
    imageUrl: "image_url"
  });
});

// node_modules/@openrouter/sdk/esm/models/responseinputtext.js
var ResponseInputTextType = {
  InputText: "input_text"
};
var ResponseInputTextType$inboundSchema = _enum(ResponseInputTextType);
var ResponseInputTextType$outboundSchema = ResponseInputTextType$inboundSchema;
var ResponseInputText$inboundSchema = object({
  type: ResponseInputTextType$inboundSchema,
  text: string2()
});
var ResponseInputText$outboundSchema = object({
  type: ResponseInputTextType$outboundSchema,
  text: string2()
});

// node_modules/@openrouter/sdk/esm/models/toolcallstatus.js
var ToolCallStatus = {
  InProgress: "in_progress",
  Completed: "completed",
  Incomplete: "incomplete"
};
var ToolCallStatus$inboundSchema = union([
  _enum(ToolCallStatus),
  string2().transform(catchUnrecognizedEnum)
]);
var ToolCallStatus$outboundSchema = union([
  _enum(ToolCallStatus),
  string2().and(custom())
]);

// node_modules/@openrouter/sdk/esm/models/openairesponsesinputunion.js
var OpenAIResponsesInputTypeFunctionCall = {
  FunctionCall: "function_call"
};
var OpenAIResponsesInputTypeFunctionCallOutput = {
  FunctionCallOutput: "function_call_output"
};
var OpenAIResponsesInputTypeMessage2 = {
  Message: "message"
};
var OpenAIResponsesInputRoleDeveloper2 = {
  Developer: "developer"
};
var OpenAIResponsesInputRoleSystem2 = {
  System: "system"
};
var OpenAIResponsesInputRoleUser2 = {
  User: "user"
};
var OpenAIResponsesInputTypeMessage1 = {
  Message: "message"
};
var OpenAIResponsesInputRoleDeveloper1 = {
  Developer: "developer"
};
var OpenAIResponsesInputRoleAssistant = {
  Assistant: "assistant"
};
var OpenAIResponsesInputRoleSystem1 = {
  System: "system"
};
var OpenAIResponsesInputRoleUser1 = {
  User: "user"
};
var OpenAIResponsesInputTypeFunctionCall$inboundSchema = _enum(OpenAIResponsesInputTypeFunctionCall);
var OpenAIResponsesInputFunctionCall$inboundSchema = object({
  type: OpenAIResponsesInputTypeFunctionCall$inboundSchema,
  call_id: string2(),
  name: string2(),
  arguments: string2(),
  id: string2().optional(),
  status: nullable(ToolCallStatus$inboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    "call_id": "callId"
  });
});
var OpenAIResponsesInputTypeFunctionCallOutput$inboundSchema = _enum(OpenAIResponsesInputTypeFunctionCallOutput);
var OpenAIResponsesInputFunctionCallOutput$inboundSchema = object({
  type: OpenAIResponsesInputTypeFunctionCallOutput$inboundSchema,
  id: nullable(string2()).optional(),
  call_id: string2(),
  output: string2(),
  status: nullable(ToolCallStatus$inboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    "call_id": "callId"
  });
});
var OpenAIResponsesInputTypeMessage2$inboundSchema = _enum(OpenAIResponsesInputTypeMessage2);
var OpenAIResponsesInputRoleDeveloper2$inboundSchema = _enum(OpenAIResponsesInputRoleDeveloper2);
var OpenAIResponsesInputRoleSystem2$inboundSchema = _enum(OpenAIResponsesInputRoleSystem2);
var OpenAIResponsesInputRoleUser2$inboundSchema = _enum(OpenAIResponsesInputRoleUser2);
var OpenAIResponsesInputRoleUnion2$inboundSchema = union([
  OpenAIResponsesInputRoleUser2$inboundSchema,
  OpenAIResponsesInputRoleSystem2$inboundSchema,
  OpenAIResponsesInputRoleDeveloper2$inboundSchema
]);
var OpenAIResponsesInputContent3$inboundSchema = union([
  ResponseInputText$inboundSchema.and(object({ type: literal("input_text") })),
  ResponseInputImage$inboundSchema.and(object({ type: literal("input_image") })),
  ResponseInputAudio$inboundSchema.and(object({ type: literal("input_audio") })),
  ResponseInputFile$inboundSchema.and(object({ type: literal("input_file") }))
]);
var OpenAIResponsesInputMessage2$inboundSchema = object({
  id: string2(),
  type: OpenAIResponsesInputTypeMessage2$inboundSchema.optional(),
  role: union([
    OpenAIResponsesInputRoleUser2$inboundSchema,
    OpenAIResponsesInputRoleSystem2$inboundSchema,
    OpenAIResponsesInputRoleDeveloper2$inboundSchema
  ]),
  content: array(union([
    ResponseInputText$inboundSchema.and(object({ type: literal("input_text") })),
    ResponseInputImage$inboundSchema.and(object({ type: literal("input_image") })),
    ResponseInputAudio$inboundSchema.and(object({ type: literal("input_audio") })),
    ResponseInputFile$inboundSchema.and(object({ type: literal("input_file") }))
  ]))
});
var OpenAIResponsesInputTypeMessage1$inboundSchema = _enum(OpenAIResponsesInputTypeMessage1);
var OpenAIResponsesInputRoleDeveloper1$inboundSchema = _enum(OpenAIResponsesInputRoleDeveloper1);
var OpenAIResponsesInputRoleAssistant$inboundSchema = _enum(OpenAIResponsesInputRoleAssistant);
var OpenAIResponsesInputRoleSystem1$inboundSchema = _enum(OpenAIResponsesInputRoleSystem1);
var OpenAIResponsesInputRoleUser1$inboundSchema = _enum(OpenAIResponsesInputRoleUser1);
var OpenAIResponsesInputRoleUnion1$inboundSchema = union([
  OpenAIResponsesInputRoleUser1$inboundSchema,
  OpenAIResponsesInputRoleSystem1$inboundSchema,
  OpenAIResponsesInputRoleAssistant$inboundSchema,
  OpenAIResponsesInputRoleDeveloper1$inboundSchema
]);
var OpenAIResponsesInputContent1$inboundSchema = union([
  ResponseInputText$inboundSchema.and(object({ type: literal("input_text") })),
  ResponseInputImage$inboundSchema.and(object({ type: literal("input_image") })),
  ResponseInputAudio$inboundSchema.and(object({ type: literal("input_audio") })),
  ResponseInputFile$inboundSchema.and(object({ type: literal("input_file") }))
]);
var OpenAIResponsesInputContent2$inboundSchema = union([
  array(union([
    ResponseInputText$inboundSchema.and(object({ type: literal("input_text") })),
    ResponseInputImage$inboundSchema.and(object({ type: literal("input_image") })),
    ResponseInputAudio$inboundSchema.and(object({ type: literal("input_audio") })),
    ResponseInputFile$inboundSchema.and(object({ type: literal("input_file") }))
  ])),
  string2()
]);
var OpenAIResponsesInputMessage1$inboundSchema = object({
  type: OpenAIResponsesInputTypeMessage1$inboundSchema.optional(),
  role: union([
    OpenAIResponsesInputRoleUser1$inboundSchema,
    OpenAIResponsesInputRoleSystem1$inboundSchema,
    OpenAIResponsesInputRoleAssistant$inboundSchema,
    OpenAIResponsesInputRoleDeveloper1$inboundSchema
  ]),
  content: union([
    array(union([
      ResponseInputText$inboundSchema.and(object({ type: literal("input_text") })),
      ResponseInputImage$inboundSchema.and(object({ type: literal("input_image") })),
      ResponseInputAudio$inboundSchema.and(object({ type: literal("input_audio") })),
      ResponseInputFile$inboundSchema.and(object({ type: literal("input_file") }))
    ])),
    string2()
  ])
});
var OpenAIResponsesInputUnion1$inboundSchema = union([
  lazy(() => OpenAIResponsesInputFunctionCall$inboundSchema),
  OutputMessage$inboundSchema,
  lazy(() => OpenAIResponsesInputMessage2$inboundSchema),
  lazy(() => OpenAIResponsesInputFunctionCallOutput$inboundSchema),
  OutputItemImageGenerationCall$inboundSchema,
  lazy(() => OpenAIResponsesInputMessage1$inboundSchema)
]);
var OpenAIResponsesInputUnion$inboundSchema = union([
  string2(),
  array(union([
    lazy(() => OpenAIResponsesInputFunctionCall$inboundSchema),
    OutputMessage$inboundSchema,
    lazy(() => OpenAIResponsesInputMessage2$inboundSchema),
    lazy(() => OpenAIResponsesInputFunctionCallOutput$inboundSchema),
    OutputItemImageGenerationCall$inboundSchema,
    lazy(() => OpenAIResponsesInputMessage1$inboundSchema)
  ])),
  any()
]);

// node_modules/@openrouter/sdk/esm/models/openairesponsesprompt.js
var Variables$inboundSchema = union([
  ResponseInputText$inboundSchema,
  ResponseInputImage$inboundSchema,
  ResponseInputFile$inboundSchema,
  string2()
]);
var Variables$outboundSchema = union([
  ResponseInputText$outboundSchema,
  ResponseInputImage$outboundSchema,
  ResponseInputFile$outboundSchema,
  string2()
]);
var OpenAIResponsesPrompt$inboundSchema = object({
  id: string2(),
  variables: nullable(record(string2(), union([
    ResponseInputText$inboundSchema,
    ResponseInputImage$inboundSchema,
    ResponseInputFile$inboundSchema,
    string2()
  ]))).optional()
});
var OpenAIResponsesPrompt$outboundSchema = object({
  id: string2(),
  variables: nullable(record(string2(), union([
    ResponseInputText$outboundSchema,
    ResponseInputImage$outboundSchema,
    ResponseInputFile$outboundSchema,
    string2()
  ]))).optional()
});

// node_modules/@openrouter/sdk/esm/models/openairesponsesreasoningeffort.js
var OpenAIResponsesReasoningEffort = {
  High: "high",
  Medium: "medium",
  Low: "low",
  Minimal: "minimal"
};
var OpenAIResponsesReasoningEffort$inboundSchema = union([
  _enum(OpenAIResponsesReasoningEffort),
  string2().transform(catchUnrecognizedEnum)
]);
var OpenAIResponsesReasoningEffort$outboundSchema = union([
  _enum(OpenAIResponsesReasoningEffort),
  string2().and(custom())
]);

// node_modules/@openrouter/sdk/esm/models/openairesponsesreasoningconfig.js
var OpenAIResponsesReasoningConfig$inboundSchema = object({
  effort: nullable(OpenAIResponsesReasoningEffort$inboundSchema).optional(),
  summary: ReasoningSummaryVerbosity$inboundSchema.optional()
});

// node_modules/@openrouter/sdk/esm/models/openairesponsesresponsestatus.js
var OpenAIResponsesResponseStatus = {
  Completed: "completed",
  Incomplete: "incomplete",
  InProgress: "in_progress",
  Failed: "failed",
  Cancelled: "cancelled",
  Queued: "queued"
};
var OpenAIResponsesResponseStatus$inboundSchema = union([
  _enum(OpenAIResponsesResponseStatus),
  string2().transform(catchUnrecognizedEnum)
]);

// node_modules/@openrouter/sdk/esm/models/openairesponsesservicetier.js
var OpenAIResponsesServiceTier = {
  Auto: "auto",
  Default: "default",
  Flex: "flex",
  Priority: "priority",
  Scale: "scale"
};
var OpenAIResponsesServiceTier$inboundSchema = union([
  _enum(OpenAIResponsesServiceTier),
  string2().transform(catchUnrecognizedEnum)
]);

// node_modules/@openrouter/sdk/esm/models/openairesponsestoolchoiceunion.js
var OpenAIResponsesToolChoiceTypeWebSearchPreview = {
  WebSearchPreview: "web_search_preview"
};
var OpenAIResponsesToolChoiceTypeWebSearchPreview20250311 = {
  WebSearchPreview20250311: "web_search_preview_2025_03_11"
};
var OpenAIResponsesToolChoiceTypeFunction = {
  Function: "function"
};
var OpenAIResponsesToolChoiceRequired = {
  Required: "required"
};
var OpenAIResponsesToolChoiceNone = {
  None: "none"
};
var OpenAIResponsesToolChoiceAuto = {
  Auto: "auto"
};
var OpenAIResponsesToolChoiceTypeWebSearchPreview$inboundSchema = _enum(OpenAIResponsesToolChoiceTypeWebSearchPreview);
var OpenAIResponsesToolChoiceTypeWebSearchPreview$outboundSchema = OpenAIResponsesToolChoiceTypeWebSearchPreview$inboundSchema;
var OpenAIResponsesToolChoiceTypeWebSearchPreview20250311$inboundSchema = _enum(OpenAIResponsesToolChoiceTypeWebSearchPreview20250311);
var OpenAIResponsesToolChoiceTypeWebSearchPreview20250311$outboundSchema = OpenAIResponsesToolChoiceTypeWebSearchPreview20250311$inboundSchema;
var Type$inboundSchema = union([
  OpenAIResponsesToolChoiceTypeWebSearchPreview20250311$inboundSchema,
  OpenAIResponsesToolChoiceTypeWebSearchPreview$inboundSchema
]);
var Type$outboundSchema = union([
  OpenAIResponsesToolChoiceTypeWebSearchPreview20250311$outboundSchema,
  OpenAIResponsesToolChoiceTypeWebSearchPreview$outboundSchema
]);
var OpenAIResponsesToolChoice$inboundSchema = object({
  type: union([
    OpenAIResponsesToolChoiceTypeWebSearchPreview20250311$inboundSchema,
    OpenAIResponsesToolChoiceTypeWebSearchPreview$inboundSchema
  ])
});
var OpenAIResponsesToolChoice$outboundSchema = object({
  type: union([
    OpenAIResponsesToolChoiceTypeWebSearchPreview20250311$outboundSchema,
    OpenAIResponsesToolChoiceTypeWebSearchPreview$outboundSchema
  ])
});
var OpenAIResponsesToolChoiceTypeFunction$inboundSchema = _enum(OpenAIResponsesToolChoiceTypeFunction);
var OpenAIResponsesToolChoiceTypeFunction$outboundSchema = OpenAIResponsesToolChoiceTypeFunction$inboundSchema;
var OpenAIResponsesToolChoiceFunction$inboundSchema = object({
  type: OpenAIResponsesToolChoiceTypeFunction$inboundSchema,
  name: string2()
});
var OpenAIResponsesToolChoiceFunction$outboundSchema = object({
  type: OpenAIResponsesToolChoiceTypeFunction$outboundSchema,
  name: string2()
});
var OpenAIResponsesToolChoiceRequired$inboundSchema = _enum(OpenAIResponsesToolChoiceRequired);
var OpenAIResponsesToolChoiceRequired$outboundSchema = OpenAIResponsesToolChoiceRequired$inboundSchema;
var OpenAIResponsesToolChoiceNone$inboundSchema = _enum(OpenAIResponsesToolChoiceNone);
var OpenAIResponsesToolChoiceNone$outboundSchema = OpenAIResponsesToolChoiceNone$inboundSchema;
var OpenAIResponsesToolChoiceAuto$inboundSchema = _enum(OpenAIResponsesToolChoiceAuto);
var OpenAIResponsesToolChoiceAuto$outboundSchema = OpenAIResponsesToolChoiceAuto$inboundSchema;
var OpenAIResponsesToolChoiceUnion$inboundSchema = union([
  lazy(() => OpenAIResponsesToolChoiceFunction$inboundSchema),
  lazy(() => OpenAIResponsesToolChoice$inboundSchema),
  OpenAIResponsesToolChoiceAuto$inboundSchema,
  OpenAIResponsesToolChoiceNone$inboundSchema,
  OpenAIResponsesToolChoiceRequired$inboundSchema
]);
var OpenAIResponsesToolChoiceUnion$outboundSchema = union([
  lazy(() => OpenAIResponsesToolChoiceFunction$outboundSchema),
  lazy(() => OpenAIResponsesToolChoice$outboundSchema),
  OpenAIResponsesToolChoiceAuto$outboundSchema,
  OpenAIResponsesToolChoiceNone$outboundSchema,
  OpenAIResponsesToolChoiceRequired$outboundSchema
]);

// node_modules/@openrouter/sdk/esm/models/openairesponsestruncation.js
var OpenAIResponsesTruncation = {
  Auto: "auto",
  Disabled: "disabled"
};
var OpenAIResponsesTruncation$inboundSchema = union([
  _enum(OpenAIResponsesTruncation),
  string2().transform(catchUnrecognizedEnum)
]);

// node_modules/@openrouter/sdk/esm/models/openresponseseasyinputmessage.js
var OpenResponsesEasyInputMessageType = {
  Message: "message"
};
var OpenResponsesEasyInputMessageRoleDeveloper = {
  Developer: "developer"
};
var OpenResponsesEasyInputMessageRoleAssistant = {
  Assistant: "assistant"
};
var OpenResponsesEasyInputMessageRoleSystem = {
  System: "system"
};
var OpenResponsesEasyInputMessageRoleUser = {
  User: "user"
};
var OpenResponsesEasyInputMessageType$outboundSchema = _enum(OpenResponsesEasyInputMessageType);
var OpenResponsesEasyInputMessageRoleDeveloper$outboundSchema = _enum(OpenResponsesEasyInputMessageRoleDeveloper);
var OpenResponsesEasyInputMessageRoleAssistant$outboundSchema = _enum(OpenResponsesEasyInputMessageRoleAssistant);
var OpenResponsesEasyInputMessageRoleSystem$outboundSchema = _enum(OpenResponsesEasyInputMessageRoleSystem);
var OpenResponsesEasyInputMessageRoleUser$outboundSchema = _enum(OpenResponsesEasyInputMessageRoleUser);
var OpenResponsesEasyInputMessageRoleUnion$outboundSchema = union([
  OpenResponsesEasyInputMessageRoleUser$outboundSchema,
  OpenResponsesEasyInputMessageRoleSystem$outboundSchema,
  OpenResponsesEasyInputMessageRoleAssistant$outboundSchema,
  OpenResponsesEasyInputMessageRoleDeveloper$outboundSchema
]);
var OpenResponsesEasyInputMessageContent1$outboundSchema = union([
  ResponseInputText$outboundSchema.and(object({ type: literal("input_text") })),
  ResponseInputImage$outboundSchema.and(object({ type: literal("input_image") })),
  ResponseInputAudio$outboundSchema.and(object({ type: literal("input_audio") })),
  ResponseInputFile$outboundSchema.and(object({ type: literal("input_file") }))
]);
var OpenResponsesEasyInputMessageContent2$outboundSchema = union([
  array(union([
    ResponseInputText$outboundSchema.and(object({ type: literal("input_text") })),
    ResponseInputImage$outboundSchema.and(object({ type: literal("input_image") })),
    ResponseInputAudio$outboundSchema.and(object({ type: literal("input_audio") })),
    ResponseInputFile$outboundSchema.and(object({ type: literal("input_file") }))
  ])),
  string2()
]);
var OpenResponsesEasyInputMessage$outboundSchema = object({
  type: OpenResponsesEasyInputMessageType$outboundSchema.optional(),
  role: union([
    OpenResponsesEasyInputMessageRoleUser$outboundSchema,
    OpenResponsesEasyInputMessageRoleSystem$outboundSchema,
    OpenResponsesEasyInputMessageRoleAssistant$outboundSchema,
    OpenResponsesEasyInputMessageRoleDeveloper$outboundSchema
  ]),
  content: union([
    array(union([
      ResponseInputText$outboundSchema.and(object({ type: literal("input_text") })),
      ResponseInputImage$outboundSchema.and(object({ type: literal("input_image") })),
      ResponseInputAudio$outboundSchema.and(object({ type: literal("input_audio") })),
      ResponseInputFile$outboundSchema.and(object({ type: literal("input_file") }))
    ])),
    string2()
  ])
});

// node_modules/@openrouter/sdk/esm/models/openresponseserrorevent.js
var OpenResponsesErrorEventType = {
  Error: "error"
};
var OpenResponsesErrorEventType$inboundSchema = _enum(OpenResponsesErrorEventType);
var OpenResponsesErrorEvent$inboundSchema = object({
  type: OpenResponsesErrorEventType$inboundSchema,
  code: nullable(string2()),
  message: string2(),
  param: nullable(string2()),
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "sequence_number": "sequenceNumber"
  });
});

// node_modules/@openrouter/sdk/esm/models/openresponsesfunctioncalloutput.js
var OpenResponsesFunctionCallOutputType = {
  FunctionCallOutput: "function_call_output"
};
var OpenResponsesFunctionCallOutputType$outboundSchema = _enum(OpenResponsesFunctionCallOutputType);
var OpenResponsesFunctionCallOutput$outboundSchema = object({
  type: OpenResponsesFunctionCallOutputType$outboundSchema,
  id: nullable(string2()).optional(),
  callId: string2(),
  output: string2(),
  status: nullable(ToolCallStatus$outboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    callId: "call_id"
  });
});

// node_modules/@openrouter/sdk/esm/models/openresponsesfunctiontoolcall.js
var OpenResponsesFunctionToolCallType = {
  FunctionCall: "function_call"
};
var OpenResponsesFunctionToolCallType$outboundSchema = _enum(OpenResponsesFunctionToolCallType);
var OpenResponsesFunctionToolCall$outboundSchema = object({
  type: OpenResponsesFunctionToolCallType$outboundSchema,
  callId: string2(),
  name: string2(),
  arguments: string2(),
  id: string2(),
  status: nullable(ToolCallStatus$outboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    callId: "call_id"
  });
});

// node_modules/@openrouter/sdk/esm/models/openresponsesimagegencallcompleted.js
var OpenResponsesImageGenCallCompletedType = {
  ResponseImageGenerationCallCompleted: "response.image_generation_call.completed"
};
var OpenResponsesImageGenCallCompletedType$inboundSchema = _enum(OpenResponsesImageGenCallCompletedType);
var OpenResponsesImageGenCallCompleted$inboundSchema = object({
  type: OpenResponsesImageGenCallCompletedType$inboundSchema,
  item_id: string2(),
  output_index: number2(),
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "item_id": "itemId",
    "output_index": "outputIndex",
    "sequence_number": "sequenceNumber"
  });
});

// node_modules/@openrouter/sdk/esm/models/openresponsesimagegencallgenerating.js
var OpenResponsesImageGenCallGeneratingType = {
  ResponseImageGenerationCallGenerating: "response.image_generation_call.generating"
};
var OpenResponsesImageGenCallGeneratingType$inboundSchema = _enum(OpenResponsesImageGenCallGeneratingType);
var OpenResponsesImageGenCallGenerating$inboundSchema = object({
  type: OpenResponsesImageGenCallGeneratingType$inboundSchema,
  item_id: string2(),
  output_index: number2(),
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "item_id": "itemId",
    "output_index": "outputIndex",
    "sequence_number": "sequenceNumber"
  });
});

// node_modules/@openrouter/sdk/esm/models/openresponsesimagegencallinprogress.js
var OpenResponsesImageGenCallInProgressType = {
  ResponseImageGenerationCallInProgress: "response.image_generation_call.in_progress"
};
var OpenResponsesImageGenCallInProgressType$inboundSchema = _enum(OpenResponsesImageGenCallInProgressType);
var OpenResponsesImageGenCallInProgress$inboundSchema = object({
  type: OpenResponsesImageGenCallInProgressType$inboundSchema,
  item_id: string2(),
  output_index: number2(),
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "item_id": "itemId",
    "output_index": "outputIndex",
    "sequence_number": "sequenceNumber"
  });
});

// node_modules/@openrouter/sdk/esm/models/openresponsesimagegencallpartialimage.js
var OpenResponsesImageGenCallPartialImageType = {
  ResponseImageGenerationCallPartialImage: "response.image_generation_call.partial_image"
};
var OpenResponsesImageGenCallPartialImageType$inboundSchema = _enum(OpenResponsesImageGenCallPartialImageType);
var OpenResponsesImageGenCallPartialImage$inboundSchema = object({
  type: OpenResponsesImageGenCallPartialImageType$inboundSchema,
  item_id: string2(),
  output_index: number2(),
  sequence_number: number2(),
  partial_image_b64: string2(),
  partial_image_index: number2()
}).transform((v) => {
  return remap(v, {
    "item_id": "itemId",
    "output_index": "outputIndex",
    "sequence_number": "sequenceNumber",
    "partial_image_b64": "partialImageB64",
    "partial_image_index": "partialImageIndex"
  });
});

// node_modules/@openrouter/sdk/esm/models/openresponsesinputmessageitem.js
var OpenResponsesInputMessageItemType = {
  Message: "message"
};
var OpenResponsesInputMessageItemRoleDeveloper = {
  Developer: "developer"
};
var OpenResponsesInputMessageItemRoleSystem = {
  System: "system"
};
var OpenResponsesInputMessageItemRoleUser = {
  User: "user"
};
var OpenResponsesInputMessageItemType$outboundSchema = _enum(OpenResponsesInputMessageItemType);
var OpenResponsesInputMessageItemRoleDeveloper$outboundSchema = _enum(OpenResponsesInputMessageItemRoleDeveloper);
var OpenResponsesInputMessageItemRoleSystem$outboundSchema = _enum(OpenResponsesInputMessageItemRoleSystem);
var OpenResponsesInputMessageItemRoleUser$outboundSchema = _enum(OpenResponsesInputMessageItemRoleUser);
var OpenResponsesInputMessageItemRoleUnion$outboundSchema = union([
  OpenResponsesInputMessageItemRoleUser$outboundSchema,
  OpenResponsesInputMessageItemRoleSystem$outboundSchema,
  OpenResponsesInputMessageItemRoleDeveloper$outboundSchema
]);
var OpenResponsesInputMessageItemContent$outboundSchema = union([
  ResponseInputText$outboundSchema.and(object({ type: literal("input_text") })),
  ResponseInputImage$outboundSchema.and(object({ type: literal("input_image") })),
  ResponseInputAudio$outboundSchema.and(object({ type: literal("input_audio") })),
  ResponseInputFile$outboundSchema.and(object({ type: literal("input_file") }))
]);
var OpenResponsesInputMessageItem$outboundSchema = object({
  id: string2().optional(),
  type: OpenResponsesInputMessageItemType$outboundSchema.optional(),
  role: union([
    OpenResponsesInputMessageItemRoleUser$outboundSchema,
    OpenResponsesInputMessageItemRoleSystem$outboundSchema,
    OpenResponsesInputMessageItemRoleDeveloper$outboundSchema
  ]),
  content: array(union([
    ResponseInputText$outboundSchema.and(object({ type: literal("input_text") })),
    ResponseInputImage$outboundSchema.and(object({ type: literal("input_image") })),
    ResponseInputAudio$outboundSchema.and(object({ type: literal("input_audio") })),
    ResponseInputFile$outboundSchema.and(object({ type: literal("input_file") }))
  ]))
});

// node_modules/@openrouter/sdk/esm/models/reasoningsummarytext.js
var ReasoningSummaryTextType = {
  SummaryText: "summary_text"
};
var ReasoningSummaryTextType$inboundSchema = _enum(ReasoningSummaryTextType);
var ReasoningSummaryTextType$outboundSchema = ReasoningSummaryTextType$inboundSchema;
var ReasoningSummaryText$inboundSchema = object({
  type: ReasoningSummaryTextType$inboundSchema,
  text: string2()
});
var ReasoningSummaryText$outboundSchema = object({
  type: ReasoningSummaryTextType$outboundSchema,
  text: string2()
});

// node_modules/@openrouter/sdk/esm/models/reasoningtextcontent.js
var ReasoningTextContentType = {
  ReasoningText: "reasoning_text"
};
var ReasoningTextContentType$inboundSchema = _enum(ReasoningTextContentType);
var ReasoningTextContentType$outboundSchema = ReasoningTextContentType$inboundSchema;
var ReasoningTextContent$inboundSchema = object({
  type: ReasoningTextContentType$inboundSchema,
  text: string2()
});
var ReasoningTextContent$outboundSchema = object({
  type: ReasoningTextContentType$outboundSchema,
  text: string2()
});

// node_modules/@openrouter/sdk/esm/models/openresponsesreasoning.js
var OpenResponsesReasoningType = {
  Reasoning: "reasoning"
};
var OpenResponsesReasoningStatusInProgress = {
  InProgress: "in_progress"
};
var OpenResponsesReasoningStatusIncomplete = {
  Incomplete: "incomplete"
};
var OpenResponsesReasoningStatusCompleted = {
  Completed: "completed"
};
var OpenResponsesReasoningFormat = {
  Unknown: "unknown",
  OpenaiResponsesV1: "openai-responses-v1",
  XaiResponsesV1: "xai-responses-v1",
  AnthropicClaudeV1: "anthropic-claude-v1"
};
var OpenResponsesReasoningType$outboundSchema = _enum(OpenResponsesReasoningType);
var OpenResponsesReasoningStatusInProgress$outboundSchema = _enum(OpenResponsesReasoningStatusInProgress);
var OpenResponsesReasoningStatusIncomplete$outboundSchema = _enum(OpenResponsesReasoningStatusIncomplete);
var OpenResponsesReasoningStatusCompleted$outboundSchema = _enum(OpenResponsesReasoningStatusCompleted);
var OpenResponsesReasoningStatusUnion$outboundSchema = union([
  OpenResponsesReasoningStatusCompleted$outboundSchema,
  OpenResponsesReasoningStatusIncomplete$outboundSchema,
  OpenResponsesReasoningStatusInProgress$outboundSchema
]);
var OpenResponsesReasoningFormat$outboundSchema = union([
  _enum(OpenResponsesReasoningFormat),
  string2().and(custom())
]);
var OpenResponsesReasoning$outboundSchema = object({
  type: OpenResponsesReasoningType$outboundSchema,
  id: string2(),
  content: array(ReasoningTextContent$outboundSchema).optional(),
  summary: array(ReasoningSummaryText$outboundSchema),
  encryptedContent: nullable(string2()).optional(),
  status: union([
    OpenResponsesReasoningStatusCompleted$outboundSchema,
    OpenResponsesReasoningStatusIncomplete$outboundSchema,
    OpenResponsesReasoningStatusInProgress$outboundSchema
  ]).optional(),
  signature: nullable(string2()).optional(),
  format: nullable(OpenResponsesReasoningFormat$outboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    encryptedContent: "encrypted_content"
  });
});

// node_modules/@openrouter/sdk/esm/models/responsesimagegenerationcall.js
var ResponsesImageGenerationCallType = {
  ImageGenerationCall: "image_generation_call"
};
var ResponsesImageGenerationCallType$inboundSchema = _enum(ResponsesImageGenerationCallType);
var ResponsesImageGenerationCallType$outboundSchema = ResponsesImageGenerationCallType$inboundSchema;
var ResponsesImageGenerationCall$inboundSchema = object({
  type: ResponsesImageGenerationCallType$inboundSchema,
  id: string2(),
  result: nullable(string2()).default(null),
  status: ImageGenerationStatus$inboundSchema
});
var ResponsesImageGenerationCall$outboundSchema = object({
  type: ResponsesImageGenerationCallType$outboundSchema,
  id: string2(),
  result: nullable(string2()).default(null),
  status: ImageGenerationStatus$outboundSchema
});

// node_modules/@openrouter/sdk/esm/models/websearchstatus.js
var WebSearchStatus = {
  Completed: "completed",
  Searching: "searching",
  InProgress: "in_progress",
  Failed: "failed"
};
var WebSearchStatus$inboundSchema = union([
  _enum(WebSearchStatus),
  string2().transform(catchUnrecognizedEnum)
]);
var WebSearchStatus$outboundSchema = union([
  _enum(WebSearchStatus),
  string2().and(custom())
]);

// node_modules/@openrouter/sdk/esm/models/responsesoutputitemfilesearchcall.js
var ResponsesOutputItemFileSearchCallType = {
  FileSearchCall: "file_search_call"
};
var ResponsesOutputItemFileSearchCallType$inboundSchema = _enum(ResponsesOutputItemFileSearchCallType);
var ResponsesOutputItemFileSearchCallType$outboundSchema = ResponsesOutputItemFileSearchCallType$inboundSchema;
var ResponsesOutputItemFileSearchCall$inboundSchema = object({
  type: ResponsesOutputItemFileSearchCallType$inboundSchema,
  id: string2(),
  queries: array(string2()),
  status: WebSearchStatus$inboundSchema
});
var ResponsesOutputItemFileSearchCall$outboundSchema = object({
  type: ResponsesOutputItemFileSearchCallType$outboundSchema,
  id: string2(),
  queries: array(string2()),
  status: WebSearchStatus$outboundSchema
});

// node_modules/@openrouter/sdk/esm/models/responsesoutputitemfunctioncall.js
var ResponsesOutputItemFunctionCallType = {
  FunctionCall: "function_call"
};
var ResponsesOutputItemFunctionCallStatusInProgress = {
  InProgress: "in_progress"
};
var ResponsesOutputItemFunctionCallStatusIncomplete = {
  Incomplete: "incomplete"
};
var ResponsesOutputItemFunctionCallStatusCompleted = {
  Completed: "completed"
};
var ResponsesOutputItemFunctionCallType$inboundSchema = _enum(ResponsesOutputItemFunctionCallType);
var ResponsesOutputItemFunctionCallType$outboundSchema = ResponsesOutputItemFunctionCallType$inboundSchema;
var ResponsesOutputItemFunctionCallStatusInProgress$inboundSchema = _enum(ResponsesOutputItemFunctionCallStatusInProgress);
var ResponsesOutputItemFunctionCallStatusInProgress$outboundSchema = ResponsesOutputItemFunctionCallStatusInProgress$inboundSchema;
var ResponsesOutputItemFunctionCallStatusIncomplete$inboundSchema = _enum(ResponsesOutputItemFunctionCallStatusIncomplete);
var ResponsesOutputItemFunctionCallStatusIncomplete$outboundSchema = ResponsesOutputItemFunctionCallStatusIncomplete$inboundSchema;
var ResponsesOutputItemFunctionCallStatusCompleted$inboundSchema = _enum(ResponsesOutputItemFunctionCallStatusCompleted);
var ResponsesOutputItemFunctionCallStatusCompleted$outboundSchema = ResponsesOutputItemFunctionCallStatusCompleted$inboundSchema;
var ResponsesOutputItemFunctionCallStatusUnion$inboundSchema = union([
  ResponsesOutputItemFunctionCallStatusCompleted$inboundSchema,
  ResponsesOutputItemFunctionCallStatusIncomplete$inboundSchema,
  ResponsesOutputItemFunctionCallStatusInProgress$inboundSchema
]);
var ResponsesOutputItemFunctionCallStatusUnion$outboundSchema = union([
  ResponsesOutputItemFunctionCallStatusCompleted$outboundSchema,
  ResponsesOutputItemFunctionCallStatusIncomplete$outboundSchema,
  ResponsesOutputItemFunctionCallStatusInProgress$outboundSchema
]);
var ResponsesOutputItemFunctionCall$inboundSchema = object({
  type: ResponsesOutputItemFunctionCallType$inboundSchema,
  id: string2().optional(),
  name: string2(),
  arguments: string2(),
  call_id: string2(),
  status: union([
    ResponsesOutputItemFunctionCallStatusCompleted$inboundSchema,
    ResponsesOutputItemFunctionCallStatusIncomplete$inboundSchema,
    ResponsesOutputItemFunctionCallStatusInProgress$inboundSchema
  ]).optional()
}).transform((v) => {
  return remap(v, {
    "call_id": "callId"
  });
});
var ResponsesOutputItemFunctionCall$outboundSchema = object({
  type: ResponsesOutputItemFunctionCallType$outboundSchema,
  id: string2().optional(),
  name: string2(),
  arguments: string2(),
  callId: string2(),
  status: union([
    ResponsesOutputItemFunctionCallStatusCompleted$outboundSchema,
    ResponsesOutputItemFunctionCallStatusIncomplete$outboundSchema,
    ResponsesOutputItemFunctionCallStatusInProgress$outboundSchema
  ]).optional()
}).transform((v) => {
  return remap(v, {
    callId: "call_id"
  });
});

// node_modules/@openrouter/sdk/esm/models/responsesoutputitemreasoning.js
var ResponsesOutputItemReasoningType = {
  Reasoning: "reasoning"
};
var ResponsesOutputItemReasoningStatusInProgress = {
  InProgress: "in_progress"
};
var ResponsesOutputItemReasoningStatusIncomplete = {
  Incomplete: "incomplete"
};
var ResponsesOutputItemReasoningStatusCompleted = {
  Completed: "completed"
};
var ResponsesOutputItemReasoningType$inboundSchema = _enum(ResponsesOutputItemReasoningType);
var ResponsesOutputItemReasoningType$outboundSchema = ResponsesOutputItemReasoningType$inboundSchema;
var ResponsesOutputItemReasoningStatusInProgress$inboundSchema = _enum(ResponsesOutputItemReasoningStatusInProgress);
var ResponsesOutputItemReasoningStatusInProgress$outboundSchema = ResponsesOutputItemReasoningStatusInProgress$inboundSchema;
var ResponsesOutputItemReasoningStatusIncomplete$inboundSchema = _enum(ResponsesOutputItemReasoningStatusIncomplete);
var ResponsesOutputItemReasoningStatusIncomplete$outboundSchema = ResponsesOutputItemReasoningStatusIncomplete$inboundSchema;
var ResponsesOutputItemReasoningStatusCompleted$inboundSchema = _enum(ResponsesOutputItemReasoningStatusCompleted);
var ResponsesOutputItemReasoningStatusCompleted$outboundSchema = ResponsesOutputItemReasoningStatusCompleted$inboundSchema;
var ResponsesOutputItemReasoningStatusUnion$inboundSchema = union([
  ResponsesOutputItemReasoningStatusCompleted$inboundSchema,
  ResponsesOutputItemReasoningStatusIncomplete$inboundSchema,
  ResponsesOutputItemReasoningStatusInProgress$inboundSchema
]);
var ResponsesOutputItemReasoningStatusUnion$outboundSchema = union([
  ResponsesOutputItemReasoningStatusCompleted$outboundSchema,
  ResponsesOutputItemReasoningStatusIncomplete$outboundSchema,
  ResponsesOutputItemReasoningStatusInProgress$outboundSchema
]);
var ResponsesOutputItemReasoning$inboundSchema = object({
  type: ResponsesOutputItemReasoningType$inboundSchema,
  id: string2(),
  content: array(ReasoningTextContent$inboundSchema).optional(),
  summary: array(ReasoningSummaryText$inboundSchema),
  encrypted_content: nullable(string2()).optional(),
  status: union([
    ResponsesOutputItemReasoningStatusCompleted$inboundSchema,
    ResponsesOutputItemReasoningStatusIncomplete$inboundSchema,
    ResponsesOutputItemReasoningStatusInProgress$inboundSchema
  ]).optional()
}).transform((v) => {
  return remap(v, {
    "encrypted_content": "encryptedContent"
  });
});
var ResponsesOutputItemReasoning$outboundSchema = object({
  type: ResponsesOutputItemReasoningType$outboundSchema,
  id: string2(),
  content: array(ReasoningTextContent$outboundSchema).optional(),
  summary: array(ReasoningSummaryText$outboundSchema),
  encryptedContent: nullable(string2()).optional(),
  status: union([
    ResponsesOutputItemReasoningStatusCompleted$outboundSchema,
    ResponsesOutputItemReasoningStatusIncomplete$outboundSchema,
    ResponsesOutputItemReasoningStatusInProgress$outboundSchema
  ]).optional()
}).transform((v) => {
  return remap(v, {
    encryptedContent: "encrypted_content"
  });
});

// node_modules/@openrouter/sdk/esm/models/responsesoutputmessage.js
var ResponsesOutputMessageRole = {
  Assistant: "assistant"
};
var ResponsesOutputMessageType = {
  Message: "message"
};
var ResponsesOutputMessageStatusInProgress = {
  InProgress: "in_progress"
};
var ResponsesOutputMessageStatusIncomplete = {
  Incomplete: "incomplete"
};
var ResponsesOutputMessageStatusCompleted = {
  Completed: "completed"
};
var ResponsesOutputMessageRole$inboundSchema = _enum(ResponsesOutputMessageRole);
var ResponsesOutputMessageRole$outboundSchema = ResponsesOutputMessageRole$inboundSchema;
var ResponsesOutputMessageType$inboundSchema = _enum(ResponsesOutputMessageType);
var ResponsesOutputMessageType$outboundSchema = ResponsesOutputMessageType$inboundSchema;
var ResponsesOutputMessageStatusInProgress$inboundSchema = _enum(ResponsesOutputMessageStatusInProgress);
var ResponsesOutputMessageStatusInProgress$outboundSchema = ResponsesOutputMessageStatusInProgress$inboundSchema;
var ResponsesOutputMessageStatusIncomplete$inboundSchema = _enum(ResponsesOutputMessageStatusIncomplete);
var ResponsesOutputMessageStatusIncomplete$outboundSchema = ResponsesOutputMessageStatusIncomplete$inboundSchema;
var ResponsesOutputMessageStatusCompleted$inboundSchema = _enum(ResponsesOutputMessageStatusCompleted);
var ResponsesOutputMessageStatusCompleted$outboundSchema = ResponsesOutputMessageStatusCompleted$inboundSchema;
var ResponsesOutputMessageStatusUnion$inboundSchema = union([
  ResponsesOutputMessageStatusCompleted$inboundSchema,
  ResponsesOutputMessageStatusIncomplete$inboundSchema,
  ResponsesOutputMessageStatusInProgress$inboundSchema
]);
var ResponsesOutputMessageStatusUnion$outboundSchema = union([
  ResponsesOutputMessageStatusCompleted$outboundSchema,
  ResponsesOutputMessageStatusIncomplete$outboundSchema,
  ResponsesOutputMessageStatusInProgress$outboundSchema
]);
var ResponsesOutputMessageContent$inboundSchema = union([
  ResponseOutputText$inboundSchema,
  OpenAIResponsesRefusalContent$inboundSchema
]);
var ResponsesOutputMessageContent$outboundSchema = union([
  ResponseOutputText$outboundSchema,
  OpenAIResponsesRefusalContent$outboundSchema
]);
var ResponsesOutputMessage$inboundSchema = object({
  id: string2(),
  role: ResponsesOutputMessageRole$inboundSchema,
  type: ResponsesOutputMessageType$inboundSchema,
  status: union([
    ResponsesOutputMessageStatusCompleted$inboundSchema,
    ResponsesOutputMessageStatusIncomplete$inboundSchema,
    ResponsesOutputMessageStatusInProgress$inboundSchema
  ]).optional(),
  content: array(union([
    ResponseOutputText$inboundSchema,
    OpenAIResponsesRefusalContent$inboundSchema
  ]))
});
var ResponsesOutputMessage$outboundSchema = object({
  id: string2(),
  role: ResponsesOutputMessageRole$outboundSchema,
  type: ResponsesOutputMessageType$outboundSchema,
  status: union([
    ResponsesOutputMessageStatusCompleted$outboundSchema,
    ResponsesOutputMessageStatusIncomplete$outboundSchema,
    ResponsesOutputMessageStatusInProgress$outboundSchema
  ]).optional(),
  content: array(union([
    ResponseOutputText$outboundSchema,
    OpenAIResponsesRefusalContent$outboundSchema
  ]))
});

// node_modules/@openrouter/sdk/esm/models/responseswebsearchcalloutput.js
var ResponsesWebSearchCallOutputType = {
  WebSearchCall: "web_search_call"
};
var ResponsesWebSearchCallOutputType$inboundSchema = _enum(ResponsesWebSearchCallOutputType);
var ResponsesWebSearchCallOutputType$outboundSchema = ResponsesWebSearchCallOutputType$inboundSchema;
var ResponsesWebSearchCallOutput$inboundSchema = object({
  type: ResponsesWebSearchCallOutputType$inboundSchema,
  id: string2(),
  status: WebSearchStatus$inboundSchema
});
var ResponsesWebSearchCallOutput$outboundSchema = object({
  type: ResponsesWebSearchCallOutputType$outboundSchema,
  id: string2(),
  status: WebSearchStatus$outboundSchema
});

// node_modules/@openrouter/sdk/esm/models/openresponsesinput.js
var OpenResponsesInput1$outboundSchema = union([
  OpenResponsesFunctionToolCall$outboundSchema,
  ResponsesOutputMessage$outboundSchema,
  ResponsesOutputItemFunctionCall$outboundSchema,
  ResponsesOutputItemFileSearchCall$outboundSchema,
  OpenResponsesReasoning$outboundSchema,
  OpenResponsesFunctionCallOutput$outboundSchema,
  ResponsesOutputItemReasoning$outboundSchema,
  ResponsesWebSearchCallOutput$outboundSchema,
  ResponsesImageGenerationCall$outboundSchema,
  OpenResponsesEasyInputMessage$outboundSchema,
  OpenResponsesInputMessageItem$outboundSchema
]);
var OpenResponsesInput$outboundSchema = union([
  string2(),
  array(union([
    OpenResponsesFunctionToolCall$outboundSchema,
    ResponsesOutputMessage$outboundSchema,
    ResponsesOutputItemFunctionCall$outboundSchema,
    ResponsesOutputItemFileSearchCall$outboundSchema,
    OpenResponsesReasoning$outboundSchema,
    OpenResponsesFunctionCallOutput$outboundSchema,
    ResponsesOutputItemReasoning$outboundSchema,
    ResponsesWebSearchCallOutput$outboundSchema,
    ResponsesImageGenerationCall$outboundSchema,
    OpenResponsesEasyInputMessage$outboundSchema,
    OpenResponsesInputMessageItem$outboundSchema
  ]))
]);

// node_modules/@openrouter/sdk/esm/models/openresponsestoplogprobs.js
var OpenResponsesTopLogprobs$inboundSchema = object({
  token: string2().optional(),
  logprob: number2().optional()
});

// node_modules/@openrouter/sdk/esm/models/openresponseslogprobs.js
var OpenResponsesLogProbs$inboundSchema = object({
  logprob: number2(),
  token: string2(),
  top_logprobs: array(OpenResponsesTopLogprobs$inboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    "top_logprobs": "topLogprobs"
  });
});

// node_modules/@openrouter/sdk/esm/models/openresponsesusage.js
var InputTokensDetails$inboundSchema = object({
  cached_tokens: number2()
}).transform((v) => {
  return remap(v, {
    "cached_tokens": "cachedTokens"
  });
});
var OutputTokensDetails$inboundSchema = object({
  reasoning_tokens: number2()
}).transform((v) => {
  return remap(v, {
    "reasoning_tokens": "reasoningTokens"
  });
});
var CostDetails$inboundSchema = object({
  upstream_inference_cost: nullable(number2()).optional(),
  upstream_inference_input_cost: number2(),
  upstream_inference_output_cost: number2()
}).transform((v) => {
  return remap(v, {
    "upstream_inference_cost": "upstreamInferenceCost",
    "upstream_inference_input_cost": "upstreamInferenceInputCost",
    "upstream_inference_output_cost": "upstreamInferenceOutputCost"
  });
});
var OpenResponsesUsage$inboundSchema = object({
  input_tokens: number2(),
  input_tokens_details: lazy(() => InputTokensDetails$inboundSchema),
  output_tokens: number2(),
  output_tokens_details: lazy(() => OutputTokensDetails$inboundSchema),
  total_tokens: number2(),
  cost: nullable(number2()).optional(),
  is_byok: boolean2().optional(),
  cost_details: lazy(() => CostDetails$inboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    "input_tokens": "inputTokens",
    "input_tokens_details": "inputTokensDetails",
    "output_tokens": "outputTokens",
    "output_tokens_details": "outputTokensDetails",
    "total_tokens": "totalTokens",
    "is_byok": "isByok",
    "cost_details": "costDetails"
  });
});

// node_modules/@openrouter/sdk/esm/models/responsessearchcontextsize.js
var ResponsesSearchContextSize = {
  Low: "low",
  Medium: "medium",
  High: "high"
};
var ResponsesSearchContextSize$inboundSchema = union([
  _enum(ResponsesSearchContextSize),
  string2().transform(catchUnrecognizedEnum)
]);
var ResponsesSearchContextSize$outboundSchema = union([
  _enum(ResponsesSearchContextSize),
  string2().and(custom())
]);

// node_modules/@openrouter/sdk/esm/models/responseswebsearchuserlocation.js
var ResponsesWebSearchUserLocationType = {
  Approximate: "approximate"
};
var ResponsesWebSearchUserLocationType$inboundSchema = _enum(ResponsesWebSearchUserLocationType);
var ResponsesWebSearchUserLocationType$outboundSchema = ResponsesWebSearchUserLocationType$inboundSchema;
var ResponsesWebSearchUserLocation$inboundSchema = object({
  type: ResponsesWebSearchUserLocationType$inboundSchema.optional(),
  city: nullable(string2()).optional(),
  country: nullable(string2()).optional(),
  region: nullable(string2()).optional(),
  timezone: nullable(string2()).optional()
});
var ResponsesWebSearchUserLocation$outboundSchema = object({
  type: ResponsesWebSearchUserLocationType$outboundSchema.optional(),
  city: nullable(string2()).optional(),
  country: nullable(string2()).optional(),
  region: nullable(string2()).optional(),
  timezone: nullable(string2()).optional()
});

// node_modules/@openrouter/sdk/esm/models/openresponseswebsearch20250826tool.js
var OpenResponsesWebSearch20250826ToolType = {
  WebSearch20250826: "web_search_2025_08_26"
};
var OpenResponsesWebSearch20250826ToolType$inboundSchema = _enum(OpenResponsesWebSearch20250826ToolType);
var OpenResponsesWebSearch20250826ToolType$outboundSchema = OpenResponsesWebSearch20250826ToolType$inboundSchema;
var OpenResponsesWebSearch20250826ToolFilters$inboundSchema = object({
  allowed_domains: nullable(array(string2())).optional()
}).transform((v) => {
  return remap(v, {
    "allowed_domains": "allowedDomains"
  });
});
var OpenResponsesWebSearch20250826ToolFilters$outboundSchema = object({
  allowedDomains: nullable(array(string2())).optional()
}).transform((v) => {
  return remap(v, {
    allowedDomains: "allowed_domains"
  });
});
var OpenResponsesWebSearch20250826Tool$inboundSchema = object({
  type: OpenResponsesWebSearch20250826ToolType$inboundSchema,
  filters: nullable(lazy(() => OpenResponsesWebSearch20250826ToolFilters$inboundSchema)).optional(),
  search_context_size: ResponsesSearchContextSize$inboundSchema.optional(),
  user_location: nullable(ResponsesWebSearchUserLocation$inboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    "search_context_size": "searchContextSize",
    "user_location": "userLocation"
  });
});
var OpenResponsesWebSearch20250826Tool$outboundSchema = object({
  type: OpenResponsesWebSearch20250826ToolType$outboundSchema,
  filters: nullable(lazy(() => OpenResponsesWebSearch20250826ToolFilters$outboundSchema)).optional(),
  searchContextSize: ResponsesSearchContextSize$outboundSchema.optional(),
  userLocation: nullable(ResponsesWebSearchUserLocation$outboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    searchContextSize: "search_context_size",
    userLocation: "user_location"
  });
});

// node_modules/@openrouter/sdk/esm/models/websearchpreviewtooluserlocation.js
var WebSearchPreviewToolUserLocationType = {
  Approximate: "approximate"
};
var WebSearchPreviewToolUserLocationType$inboundSchema = _enum(WebSearchPreviewToolUserLocationType);
var WebSearchPreviewToolUserLocationType$outboundSchema = WebSearchPreviewToolUserLocationType$inboundSchema;
var WebSearchPreviewToolUserLocation$inboundSchema = object({
  type: WebSearchPreviewToolUserLocationType$inboundSchema,
  city: nullable(string2()).optional(),
  country: nullable(string2()).optional(),
  region: nullable(string2()).optional(),
  timezone: nullable(string2()).optional()
});
var WebSearchPreviewToolUserLocation$outboundSchema = object({
  type: WebSearchPreviewToolUserLocationType$outboundSchema,
  city: nullable(string2()).optional(),
  country: nullable(string2()).optional(),
  region: nullable(string2()).optional(),
  timezone: nullable(string2()).optional()
});

// node_modules/@openrouter/sdk/esm/models/openresponseswebsearchpreview20250311tool.js
var OpenResponsesWebSearchPreview20250311ToolType = {
  WebSearchPreview20250311: "web_search_preview_2025_03_11"
};
var OpenResponsesWebSearchPreview20250311ToolType$inboundSchema = _enum(OpenResponsesWebSearchPreview20250311ToolType);
var OpenResponsesWebSearchPreview20250311ToolType$outboundSchema = OpenResponsesWebSearchPreview20250311ToolType$inboundSchema;
var OpenResponsesWebSearchPreview20250311Tool$inboundSchema = object({
  type: OpenResponsesWebSearchPreview20250311ToolType$inboundSchema,
  search_context_size: ResponsesSearchContextSize$inboundSchema.optional(),
  user_location: nullable(WebSearchPreviewToolUserLocation$inboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    "search_context_size": "searchContextSize",
    "user_location": "userLocation"
  });
});
var OpenResponsesWebSearchPreview20250311Tool$outboundSchema = object({
  type: OpenResponsesWebSearchPreview20250311ToolType$outboundSchema,
  searchContextSize: ResponsesSearchContextSize$outboundSchema.optional(),
  userLocation: nullable(WebSearchPreviewToolUserLocation$outboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    searchContextSize: "search_context_size",
    userLocation: "user_location"
  });
});

// node_modules/@openrouter/sdk/esm/models/openresponseswebsearchpreviewtool.js
var OpenResponsesWebSearchPreviewToolType = {
  WebSearchPreview: "web_search_preview"
};
var OpenResponsesWebSearchPreviewToolType$inboundSchema = _enum(OpenResponsesWebSearchPreviewToolType);
var OpenResponsesWebSearchPreviewToolType$outboundSchema = OpenResponsesWebSearchPreviewToolType$inboundSchema;
var OpenResponsesWebSearchPreviewTool$inboundSchema = object({
  type: OpenResponsesWebSearchPreviewToolType$inboundSchema,
  search_context_size: ResponsesSearchContextSize$inboundSchema.optional(),
  user_location: nullable(WebSearchPreviewToolUserLocation$inboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    "search_context_size": "searchContextSize",
    "user_location": "userLocation"
  });
});
var OpenResponsesWebSearchPreviewTool$outboundSchema = object({
  type: OpenResponsesWebSearchPreviewToolType$outboundSchema,
  searchContextSize: ResponsesSearchContextSize$outboundSchema.optional(),
  userLocation: nullable(WebSearchPreviewToolUserLocation$outboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    searchContextSize: "search_context_size",
    userLocation: "user_location"
  });
});

// node_modules/@openrouter/sdk/esm/models/openresponseswebsearchtool.js
var OpenResponsesWebSearchToolType = {
  WebSearch: "web_search"
};
var OpenResponsesWebSearchToolType$inboundSchema = _enum(OpenResponsesWebSearchToolType);
var OpenResponsesWebSearchToolType$outboundSchema = OpenResponsesWebSearchToolType$inboundSchema;
var OpenResponsesWebSearchToolFilters$inboundSchema = object({
  allowed_domains: nullable(array(string2())).optional()
}).transform((v) => {
  return remap(v, {
    "allowed_domains": "allowedDomains"
  });
});
var OpenResponsesWebSearchToolFilters$outboundSchema = object({
  allowedDomains: nullable(array(string2())).optional()
}).transform((v) => {
  return remap(v, {
    allowedDomains: "allowed_domains"
  });
});
var OpenResponsesWebSearchTool$inboundSchema = object({
  type: OpenResponsesWebSearchToolType$inboundSchema,
  filters: nullable(lazy(() => OpenResponsesWebSearchToolFilters$inboundSchema)).optional(),
  search_context_size: ResponsesSearchContextSize$inboundSchema.optional(),
  user_location: nullable(ResponsesWebSearchUserLocation$inboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    "search_context_size": "searchContextSize",
    "user_location": "userLocation"
  });
});
var OpenResponsesWebSearchTool$outboundSchema = object({
  type: OpenResponsesWebSearchToolType$outboundSchema,
  filters: nullable(lazy(() => OpenResponsesWebSearchToolFilters$outboundSchema)).optional(),
  searchContextSize: ResponsesSearchContextSize$outboundSchema.optional(),
  userLocation: nullable(ResponsesWebSearchUserLocation$outboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    searchContextSize: "search_context_size",
    userLocation: "user_location"
  });
});

// node_modules/@openrouter/sdk/esm/models/responseserrorfield.js
var CodeEnum = {
  ServerError: "server_error",
  RateLimitExceeded: "rate_limit_exceeded",
  InvalidPrompt: "invalid_prompt",
  VectorStoreTimeout: "vector_store_timeout",
  InvalidImage: "invalid_image",
  InvalidImageFormat: "invalid_image_format",
  InvalidBase64Image: "invalid_base64_image",
  InvalidImageUrl: "invalid_image_url",
  ImageTooLarge: "image_too_large",
  ImageTooSmall: "image_too_small",
  ImageParseError: "image_parse_error",
  ImageContentPolicyViolation: "image_content_policy_violation",
  InvalidImageMode: "invalid_image_mode",
  ImageFileTooLarge: "image_file_too_large",
  UnsupportedImageMediaType: "unsupported_image_media_type",
  EmptyImageFile: "empty_image_file",
  FailedToDownloadImage: "failed_to_download_image",
  ImageFileNotFound: "image_file_not_found"
};
var CodeEnum$inboundSchema = union([
  _enum(CodeEnum),
  string2().transform(catchUnrecognizedEnum)
]);
var ResponsesErrorField$inboundSchema = object({
  code: CodeEnum$inboundSchema,
  message: string2()
});

// node_modules/@openrouter/sdk/esm/models/responsesoutputitem.js
var ResponsesOutputItem$inboundSchema = union([
  ResponsesOutputMessage$inboundSchema,
  ResponsesOutputItemFunctionCall$inboundSchema,
  ResponsesOutputItemFileSearchCall$inboundSchema,
  ResponsesOutputItemReasoning$inboundSchema,
  ResponsesWebSearchCallOutput$inboundSchema,
  ResponsesImageGenerationCall$inboundSchema
]);

// node_modules/@openrouter/sdk/esm/models/responsesformatjsonobject.js
var ResponsesFormatJSONObjectType = {
  JsonObject: "json_object"
};
var ResponsesFormatJSONObjectType$inboundSchema = _enum(ResponsesFormatJSONObjectType);
var ResponsesFormatJSONObjectType$outboundSchema = ResponsesFormatJSONObjectType$inboundSchema;
var ResponsesFormatJSONObject$inboundSchema = object({
  type: ResponsesFormatJSONObjectType$inboundSchema
});
var ResponsesFormatJSONObject$outboundSchema = object({
  type: ResponsesFormatJSONObjectType$outboundSchema
});

// node_modules/@openrouter/sdk/esm/models/responsesformattext.js
var ResponsesFormatTextType = {
  Text: "text"
};
var ResponsesFormatTextType$inboundSchema = _enum(ResponsesFormatTextType);
var ResponsesFormatTextType$outboundSchema = ResponsesFormatTextType$inboundSchema;
var ResponsesFormatText$inboundSchema = object({
  type: ResponsesFormatTextType$inboundSchema
});
var ResponsesFormatText$outboundSchema = object({
  type: ResponsesFormatTextType$outboundSchema
});

// node_modules/@openrouter/sdk/esm/models/responsesformattextjsonschemaconfig.js
var ResponsesFormatTextJSONSchemaConfigType = {
  JsonSchema: "json_schema"
};
var ResponsesFormatTextJSONSchemaConfigType$inboundSchema = _enum(ResponsesFormatTextJSONSchemaConfigType);
var ResponsesFormatTextJSONSchemaConfigType$outboundSchema = ResponsesFormatTextJSONSchemaConfigType$inboundSchema;
var ResponsesFormatTextJSONSchemaConfig$inboundSchema = object({
  type: ResponsesFormatTextJSONSchemaConfigType$inboundSchema,
  name: string2(),
  description: string2().optional(),
  strict: nullable(boolean2()).optional(),
  schema: record(string2(), nullable(any()))
});
var ResponsesFormatTextJSONSchemaConfig$outboundSchema = object({
  type: ResponsesFormatTextJSONSchemaConfigType$outboundSchema,
  name: string2(),
  description: string2().optional(),
  strict: nullable(boolean2()).optional(),
  schema: record(string2(), nullable(any()))
});

// node_modules/@openrouter/sdk/esm/models/responseformattextconfig.js
var ResponseFormatTextConfig$inboundSchema = union([
  ResponsesFormatTextJSONSchemaConfig$inboundSchema,
  ResponsesFormatText$inboundSchema,
  ResponsesFormatJSONObject$inboundSchema
]);
var ResponseFormatTextConfig$outboundSchema = union([
  ResponsesFormatTextJSONSchemaConfig$outboundSchema,
  ResponsesFormatText$outboundSchema,
  ResponsesFormatJSONObject$outboundSchema
]);

// node_modules/@openrouter/sdk/esm/models/responsetextconfig.js
var ResponseTextConfigVerbosity = {
  High: "high",
  Low: "low",
  Medium: "medium"
};
var ResponseTextConfigVerbosity$inboundSchema = union([
  _enum(ResponseTextConfigVerbosity),
  string2().transform(catchUnrecognizedEnum)
]);
var ResponseTextConfig$inboundSchema = object({
  format: ResponseFormatTextConfig$inboundSchema.optional(),
  verbosity: nullable(ResponseTextConfigVerbosity$inboundSchema).optional()
});

// node_modules/@openrouter/sdk/esm/models/openresponsesnonstreamingresponse.js
var ObjectT = {
  Response: "response"
};
var OpenResponsesNonStreamingResponseType = {
  Function: "function"
};
var ObjectT$inboundSchema = _enum(ObjectT);
var OpenResponsesNonStreamingResponseType$inboundSchema = _enum(OpenResponsesNonStreamingResponseType);
var OpenResponsesNonStreamingResponseToolFunction$inboundSchema = object({
  type: OpenResponsesNonStreamingResponseType$inboundSchema,
  name: string2(),
  description: nullable(string2()).optional(),
  strict: nullable(boolean2()).optional(),
  parameters: nullable(record(string2(), nullable(any())))
});
var OpenResponsesNonStreamingResponseToolUnion$inboundSchema = union([
  lazy(() => OpenResponsesNonStreamingResponseToolFunction$inboundSchema),
  OpenResponsesWebSearchPreviewTool$inboundSchema,
  OpenResponsesWebSearchPreview20250311Tool$inboundSchema,
  OpenResponsesWebSearchTool$inboundSchema,
  OpenResponsesWebSearch20250826Tool$inboundSchema
]);
var OpenResponsesNonStreamingResponse$inboundSchema = object({
  id: string2(),
  object: ObjectT$inboundSchema,
  created_at: number2(),
  model: string2(),
  status: OpenAIResponsesResponseStatus$inboundSchema.optional(),
  output: array(ResponsesOutputItem$inboundSchema),
  user: nullable(string2()).optional(),
  output_text: string2().optional(),
  prompt_cache_key: nullable(string2()).optional(),
  safety_identifier: nullable(string2()).optional(),
  error: nullable(ResponsesErrorField$inboundSchema),
  incomplete_details: nullable(OpenAIResponsesIncompleteDetails$inboundSchema),
  usage: OpenResponsesUsage$inboundSchema.optional(),
  max_tool_calls: nullable(number2()).optional(),
  top_logprobs: number2().optional(),
  max_output_tokens: nullable(number2()).optional(),
  temperature: nullable(number2()),
  top_p: nullable(number2()),
  instructions: nullable(OpenAIResponsesInputUnion$inboundSchema).optional(),
  metadata: nullable(record(string2(), string2())),
  tools: array(union([
    lazy(() => OpenResponsesNonStreamingResponseToolFunction$inboundSchema),
    OpenResponsesWebSearchPreviewTool$inboundSchema,
    OpenResponsesWebSearchPreview20250311Tool$inboundSchema,
    OpenResponsesWebSearchTool$inboundSchema,
    OpenResponsesWebSearch20250826Tool$inboundSchema
  ])),
  tool_choice: OpenAIResponsesToolChoiceUnion$inboundSchema,
  parallel_tool_calls: boolean2(),
  prompt: nullable(OpenAIResponsesPrompt$inboundSchema).optional(),
  background: nullable(boolean2()).optional(),
  previous_response_id: nullable(string2()).optional(),
  reasoning: nullable(OpenAIResponsesReasoningConfig$inboundSchema).optional(),
  service_tier: nullable(OpenAIResponsesServiceTier$inboundSchema).optional(),
  store: boolean2().optional(),
  truncation: nullable(OpenAIResponsesTruncation$inboundSchema).optional(),
  text: ResponseTextConfig$inboundSchema.optional()
}).transform((v) => {
  return remap(v, {
    "created_at": "createdAt",
    "output_text": "outputText",
    "prompt_cache_key": "promptCacheKey",
    "safety_identifier": "safetyIdentifier",
    "incomplete_details": "incompleteDetails",
    "max_tool_calls": "maxToolCalls",
    "top_logprobs": "topLogprobs",
    "max_output_tokens": "maxOutputTokens",
    "top_p": "topP",
    "tool_choice": "toolChoice",
    "parallel_tool_calls": "parallelToolCalls",
    "previous_response_id": "previousResponseId",
    "service_tier": "serviceTier"
  });
});

// node_modules/@openrouter/sdk/esm/models/openresponsesreasoningconfig.js
var OpenResponsesReasoningConfig$outboundSchema = object({
  effort: nullable(OpenAIResponsesReasoningEffort$outboundSchema).optional(),
  summary: ReasoningSummaryVerbosity$outboundSchema.optional(),
  maxTokens: nullable(number2()).optional(),
  enabled: nullable(boolean2()).optional()
}).transform((v) => {
  return remap(v, {
    maxTokens: "max_tokens"
  });
});

// node_modules/@openrouter/sdk/esm/models/openresponsesreasoningdeltaevent.js
var OpenResponsesReasoningDeltaEventType = {
  ResponseReasoningTextDelta: "response.reasoning_text.delta"
};
var OpenResponsesReasoningDeltaEventType$inboundSchema = _enum(OpenResponsesReasoningDeltaEventType);
var OpenResponsesReasoningDeltaEvent$inboundSchema = object({
  type: OpenResponsesReasoningDeltaEventType$inboundSchema,
  output_index: number2(),
  item_id: string2(),
  content_index: number2(),
  delta: string2(),
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "output_index": "outputIndex",
    "item_id": "itemId",
    "content_index": "contentIndex",
    "sequence_number": "sequenceNumber"
  });
});

// node_modules/@openrouter/sdk/esm/models/openresponsesreasoningdoneevent.js
var OpenResponsesReasoningDoneEventType = {
  ResponseReasoningTextDone: "response.reasoning_text.done"
};
var OpenResponsesReasoningDoneEventType$inboundSchema = _enum(OpenResponsesReasoningDoneEventType);
var OpenResponsesReasoningDoneEvent$inboundSchema = object({
  type: OpenResponsesReasoningDoneEventType$inboundSchema,
  output_index: number2(),
  item_id: string2(),
  content_index: number2(),
  text: string2(),
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "output_index": "outputIndex",
    "item_id": "itemId",
    "content_index": "contentIndex",
    "sequence_number": "sequenceNumber"
  });
});

// node_modules/@openrouter/sdk/esm/models/openresponsesreasoningsummarypartaddedevent.js
var OpenResponsesReasoningSummaryPartAddedEventType = {
  ResponseReasoningSummaryPartAdded: "response.reasoning_summary_part.added"
};
var OpenResponsesReasoningSummaryPartAddedEventType$inboundSchema = _enum(OpenResponsesReasoningSummaryPartAddedEventType);
var OpenResponsesReasoningSummaryPartAddedEvent$inboundSchema = object({
  type: OpenResponsesReasoningSummaryPartAddedEventType$inboundSchema,
  output_index: number2(),
  item_id: string2(),
  summary_index: number2(),
  part: ReasoningSummaryText$inboundSchema,
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "output_index": "outputIndex",
    "item_id": "itemId",
    "summary_index": "summaryIndex",
    "sequence_number": "sequenceNumber"
  });
});

// node_modules/@openrouter/sdk/esm/models/openresponsesreasoningsummarytextdeltaevent.js
var OpenResponsesReasoningSummaryTextDeltaEventType = {
  ResponseReasoningSummaryTextDelta: "response.reasoning_summary_text.delta"
};
var OpenResponsesReasoningSummaryTextDeltaEventType$inboundSchema = _enum(OpenResponsesReasoningSummaryTextDeltaEventType);
var OpenResponsesReasoningSummaryTextDeltaEvent$inboundSchema = object({
  type: OpenResponsesReasoningSummaryTextDeltaEventType$inboundSchema,
  item_id: string2(),
  output_index: number2(),
  summary_index: number2(),
  delta: string2(),
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "item_id": "itemId",
    "output_index": "outputIndex",
    "summary_index": "summaryIndex",
    "sequence_number": "sequenceNumber"
  });
});

// node_modules/@openrouter/sdk/esm/models/openresponsesreasoningsummarytextdoneevent.js
var OpenResponsesReasoningSummaryTextDoneEventType = {
  ResponseReasoningSummaryTextDone: "response.reasoning_summary_text.done"
};
var OpenResponsesReasoningSummaryTextDoneEventType$inboundSchema = _enum(OpenResponsesReasoningSummaryTextDoneEventType);
var OpenResponsesReasoningSummaryTextDoneEvent$inboundSchema = object({
  type: OpenResponsesReasoningSummaryTextDoneEventType$inboundSchema,
  item_id: string2(),
  output_index: number2(),
  summary_index: number2(),
  text: string2(),
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "item_id": "itemId",
    "output_index": "outputIndex",
    "summary_index": "summaryIndex",
    "sequence_number": "sequenceNumber"
  });
});

// node_modules/@openrouter/sdk/esm/models/openresponsesresponsetext.js
var OpenResponsesResponseTextVerbosity = {
  High: "high",
  Low: "low",
  Medium: "medium"
};
var OpenResponsesResponseTextVerbosity$outboundSchema = union([
  _enum(OpenResponsesResponseTextVerbosity),
  string2().and(custom())
]);
var OpenResponsesResponseText$outboundSchema = object({
  format: ResponseFormatTextConfig$outboundSchema.optional(),
  verbosity: nullable(OpenResponsesResponseTextVerbosity$outboundSchema).optional()
});

// node_modules/@openrouter/sdk/esm/models/quantization.js
var Quantization = {
  Int4: "int4",
  Int8: "int8",
  Fp4: "fp4",
  Fp6: "fp6",
  Fp8: "fp8",
  Fp16: "fp16",
  Bf16: "bf16",
  Fp32: "fp32",
  Unknown: "unknown"
};
var Quantization$outboundSchema = union([
  _enum(Quantization),
  string2().and(custom())
]);

// node_modules/@openrouter/sdk/esm/models/openresponsesrequest.js
var OpenResponsesRequestType = {
  Function: "function"
};
var ServiceTier = {
  Auto: "auto",
  Default: "default",
  Flex: "flex",
  Priority: "priority",
  Scale: "scale"
};
var Truncation = {
  Auto: "auto",
  Disabled: "disabled"
};
var DataCollection = {
  Deny: "deny",
  Allow: "allow"
};
var Sort = {
  Price: "price",
  Throughput: "throughput",
  Latency: "latency"
};
var IdFileParser = {
  FileParser: "file-parser"
};
var PdfEngine = {
  MistralOcr: "mistral-ocr",
  PdfText: "pdf-text",
  Native: "native"
};
var IdWeb = {
  Web: "web"
};
var Engine = {
  Native: "native",
  Exa: "exa"
};
var IdModeration = {
  Moderation: "moderation"
};
var OpenResponsesRequestType$outboundSchema = _enum(OpenResponsesRequestType);
var OpenResponsesRequestToolFunction$outboundSchema = object({
  type: OpenResponsesRequestType$outboundSchema,
  name: string2(),
  description: nullable(string2()).optional(),
  strict: nullable(boolean2()).optional(),
  parameters: nullable(record(string2(), nullable(any())))
});
var OpenResponsesRequestToolUnion$outboundSchema = union([
  lazy(() => OpenResponsesRequestToolFunction$outboundSchema),
  OpenResponsesWebSearchPreviewTool$outboundSchema,
  OpenResponsesWebSearchPreview20250311Tool$outboundSchema,
  OpenResponsesWebSearchTool$outboundSchema,
  OpenResponsesWebSearch20250826Tool$outboundSchema
]);
var ServiceTier$outboundSchema = union([
  _enum(ServiceTier),
  string2().and(custom())
]);
var Truncation$outboundSchema = union([
  _enum(Truncation),
  string2().and(custom())
]);
var DataCollection$outboundSchema = union([
  _enum(DataCollection),
  string2().and(custom())
]);
var Order$outboundSchema = union([
  ProviderName$outboundSchema,
  string2()
]);
var Only$outboundSchema = union([
  ProviderName$outboundSchema,
  string2()
]);
var Ignore$outboundSchema = union([ProviderName$outboundSchema, string2()]);
var Sort$outboundSchema = union([
  _enum(Sort),
  string2().and(custom())
]);
var MaxPrice$outboundSchema = object({
  prompt: any().optional(),
  completion: any().optional(),
  image: any().optional(),
  audio: any().optional(),
  request: any().optional()
});
var Provider$outboundSchema = object({
  allowFallbacks: nullable(boolean2()).optional(),
  requireParameters: nullable(boolean2()).optional(),
  dataCollection: nullable(DataCollection$outboundSchema).optional(),
  zdr: nullable(boolean2()).optional(),
  enforceDistillableText: nullable(boolean2()).optional(),
  order: nullable(array(union([ProviderName$outboundSchema, string2()]))).optional(),
  only: nullable(array(union([ProviderName$outboundSchema, string2()]))).optional(),
  ignore: nullable(array(union([ProviderName$outboundSchema, string2()]))).optional(),
  quantizations: nullable(array(Quantization$outboundSchema)).optional(),
  sort: nullable(Sort$outboundSchema).optional(),
  maxPrice: lazy(() => MaxPrice$outboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    allowFallbacks: "allow_fallbacks",
    requireParameters: "require_parameters",
    dataCollection: "data_collection",
    enforceDistillableText: "enforce_distillable_text",
    maxPrice: "max_price"
  });
});
var IdFileParser$outboundSchema = _enum(IdFileParser);
var PdfEngine$outboundSchema = union([
  _enum(PdfEngine),
  string2().and(custom())
]);
var Pdf$outboundSchema = object({
  engine: PdfEngine$outboundSchema.optional()
});
var PluginFileParser$outboundSchema = object({
  id: IdFileParser$outboundSchema,
  maxFiles: number2().optional(),
  pdf: lazy(() => Pdf$outboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    maxFiles: "max_files"
  });
});
var IdWeb$outboundSchema = _enum(IdWeb);
var Engine$outboundSchema = union([
  _enum(Engine),
  string2().and(custom())
]);
var PluginWeb$outboundSchema = object({
  id: IdWeb$outboundSchema,
  maxResults: number2().optional(),
  searchPrompt: string2().optional(),
  engine: Engine$outboundSchema.optional()
}).transform((v) => {
  return remap(v, {
    maxResults: "max_results",
    searchPrompt: "search_prompt"
  });
});
var IdModeration$outboundSchema = _enum(IdModeration);
var PluginModeration$outboundSchema = object({
  id: IdModeration$outboundSchema
});
var Plugin$outboundSchema = union([
  lazy(() => PluginModeration$outboundSchema),
  lazy(() => PluginWeb$outboundSchema),
  lazy(() => PluginFileParser$outboundSchema)
]);
var OpenResponsesRequest$outboundSchema = object({
  input: OpenResponsesInput$outboundSchema.optional(),
  instructions: nullable(string2()).optional(),
  metadata: nullable(record(string2(), string2())).optional(),
  tools: array(union([
    lazy(() => OpenResponsesRequestToolFunction$outboundSchema),
    OpenResponsesWebSearchPreviewTool$outboundSchema,
    OpenResponsesWebSearchPreview20250311Tool$outboundSchema,
    OpenResponsesWebSearchTool$outboundSchema,
    OpenResponsesWebSearch20250826Tool$outboundSchema
  ])).optional(),
  toolChoice: OpenAIResponsesToolChoiceUnion$outboundSchema.optional(),
  parallelToolCalls: nullable(boolean2()).optional(),
  model: string2().optional(),
  models: array(string2()).optional(),
  text: OpenResponsesResponseText$outboundSchema.optional(),
  reasoning: nullable(OpenResponsesReasoningConfig$outboundSchema).optional(),
  maxOutputTokens: nullable(number2()).optional(),
  temperature: nullable(number2()).optional(),
  topP: nullable(number2()).optional(),
  topK: number2().optional(),
  promptCacheKey: nullable(string2()).optional(),
  previousResponseId: nullable(string2()).optional(),
  prompt: nullable(OpenAIResponsesPrompt$outboundSchema).optional(),
  include: nullable(array(OpenAIResponsesIncludable$outboundSchema)).optional(),
  background: nullable(boolean2()).optional(),
  safetyIdentifier: nullable(string2()).optional(),
  store: nullable(boolean2()).optional(),
  serviceTier: nullable(ServiceTier$outboundSchema).optional(),
  truncation: nullable(Truncation$outboundSchema).optional(),
  stream: boolean2().default(false),
  provider: nullable(lazy(() => Provider$outboundSchema)).optional(),
  plugins: array(union([
    lazy(() => PluginModeration$outboundSchema),
    lazy(() => PluginWeb$outboundSchema),
    lazy(() => PluginFileParser$outboundSchema)
  ])).optional(),
  user: string2().optional()
}).transform((v) => {
  return remap(v, {
    toolChoice: "tool_choice",
    parallelToolCalls: "parallel_tool_calls",
    maxOutputTokens: "max_output_tokens",
    topP: "top_p",
    topK: "top_k",
    promptCacheKey: "prompt_cache_key",
    previousResponseId: "previous_response_id",
    safetyIdentifier: "safety_identifier",
    serviceTier: "service_tier"
  });
});

// node_modules/@openrouter/sdk/esm/models/openresponsesstreamevent.js
var TypeResponseReasoningSummaryPartDone = {
  ResponseReasoningSummaryPartDone: "response.reasoning_summary_part.done"
};
var TypeResponseFunctionCallArgumentsDone = {
  ResponseFunctionCallArgumentsDone: "response.function_call_arguments.done"
};
var TypeResponseFunctionCallArgumentsDelta = {
  ResponseFunctionCallArgumentsDelta: "response.function_call_arguments.delta"
};
var TypeResponseOutputTextAnnotationAdded = {
  ResponseOutputTextAnnotationAdded: "response.output_text.annotation.added"
};
var TypeResponseRefusalDone = {
  ResponseRefusalDone: "response.refusal.done"
};
var TypeResponseRefusalDelta = {
  ResponseRefusalDelta: "response.refusal.delta"
};
var TypeResponseOutputTextDone = {
  ResponseOutputTextDone: "response.output_text.done"
};
var TypeResponseOutputTextDelta = {
  ResponseOutputTextDelta: "response.output_text.delta"
};
var TypeResponseContentPartDone = {
  ResponseContentPartDone: "response.content_part.done"
};
var TypeResponseContentPartAdded = {
  ResponseContentPartAdded: "response.content_part.added"
};
var TypeResponseOutputItemDone = {
  ResponseOutputItemDone: "response.output_item.done"
};
var TypeResponseOutputItemAdded = {
  ResponseOutputItemAdded: "response.output_item.added"
};
var TypeResponseFailed = {
  ResponseFailed: "response.failed"
};
var TypeResponseIncomplete = {
  ResponseIncomplete: "response.incomplete"
};
var TypeResponseCompleted = {
  ResponseCompleted: "response.completed"
};
var TypeResponseInProgress = {
  ResponseInProgress: "response.in_progress"
};
var TypeResponseCreated = {
  ResponseCreated: "response.created"
};
var TypeResponseReasoningSummaryPartDone$inboundSchema = _enum(TypeResponseReasoningSummaryPartDone);
var OpenResponsesStreamEventResponseReasoningSummaryPartDone$inboundSchema = object({
  type: TypeResponseReasoningSummaryPartDone$inboundSchema,
  output_index: number2(),
  item_id: string2(),
  summary_index: number2(),
  part: ReasoningSummaryText$inboundSchema,
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "output_index": "outputIndex",
    "item_id": "itemId",
    "summary_index": "summaryIndex",
    "sequence_number": "sequenceNumber"
  });
});
var TypeResponseFunctionCallArgumentsDone$inboundSchema = _enum(TypeResponseFunctionCallArgumentsDone);
var OpenResponsesStreamEventResponseFunctionCallArgumentsDone$inboundSchema = object({
  type: TypeResponseFunctionCallArgumentsDone$inboundSchema,
  item_id: string2(),
  output_index: number2(),
  name: string2(),
  arguments: string2(),
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "item_id": "itemId",
    "output_index": "outputIndex",
    "sequence_number": "sequenceNumber"
  });
});
var TypeResponseFunctionCallArgumentsDelta$inboundSchema = _enum(TypeResponseFunctionCallArgumentsDelta);
var OpenResponsesStreamEventResponseFunctionCallArgumentsDelta$inboundSchema = object({
  type: TypeResponseFunctionCallArgumentsDelta$inboundSchema,
  item_id: string2(),
  output_index: number2(),
  delta: string2(),
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "item_id": "itemId",
    "output_index": "outputIndex",
    "sequence_number": "sequenceNumber"
  });
});
var TypeResponseOutputTextAnnotationAdded$inboundSchema = _enum(TypeResponseOutputTextAnnotationAdded);
var OpenResponsesStreamEventResponseOutputTextAnnotationAdded$inboundSchema = object({
  type: TypeResponseOutputTextAnnotationAdded$inboundSchema,
  output_index: number2(),
  item_id: string2(),
  content_index: number2(),
  sequence_number: number2(),
  annotation_index: number2(),
  annotation: OpenAIResponsesAnnotation$inboundSchema
}).transform((v) => {
  return remap(v, {
    "output_index": "outputIndex",
    "item_id": "itemId",
    "content_index": "contentIndex",
    "sequence_number": "sequenceNumber",
    "annotation_index": "annotationIndex"
  });
});
var TypeResponseRefusalDone$inboundSchema = _enum(TypeResponseRefusalDone);
var OpenResponsesStreamEventResponseRefusalDone$inboundSchema = object({
  type: TypeResponseRefusalDone$inboundSchema,
  output_index: number2(),
  item_id: string2(),
  content_index: number2(),
  refusal: string2(),
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "output_index": "outputIndex",
    "item_id": "itemId",
    "content_index": "contentIndex",
    "sequence_number": "sequenceNumber"
  });
});
var TypeResponseRefusalDelta$inboundSchema = _enum(TypeResponseRefusalDelta);
var OpenResponsesStreamEventResponseRefusalDelta$inboundSchema = object({
  type: TypeResponseRefusalDelta$inboundSchema,
  output_index: number2(),
  item_id: string2(),
  content_index: number2(),
  delta: string2(),
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "output_index": "outputIndex",
    "item_id": "itemId",
    "content_index": "contentIndex",
    "sequence_number": "sequenceNumber"
  });
});
var TypeResponseOutputTextDone$inboundSchema = _enum(TypeResponseOutputTextDone);
var OpenResponsesStreamEventResponseOutputTextDone$inboundSchema = object({
  type: TypeResponseOutputTextDone$inboundSchema,
  output_index: number2(),
  item_id: string2(),
  content_index: number2(),
  text: string2(),
  sequence_number: number2(),
  logprobs: array(OpenResponsesLogProbs$inboundSchema)
}).transform((v) => {
  return remap(v, {
    "output_index": "outputIndex",
    "item_id": "itemId",
    "content_index": "contentIndex",
    "sequence_number": "sequenceNumber"
  });
});
var TypeResponseOutputTextDelta$inboundSchema = _enum(TypeResponseOutputTextDelta);
var OpenResponsesStreamEventResponseOutputTextDelta$inboundSchema = object({
  type: TypeResponseOutputTextDelta$inboundSchema,
  logprobs: array(OpenResponsesLogProbs$inboundSchema),
  output_index: number2(),
  item_id: string2(),
  content_index: number2(),
  delta: string2(),
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "output_index": "outputIndex",
    "item_id": "itemId",
    "content_index": "contentIndex",
    "sequence_number": "sequenceNumber"
  });
});
var TypeResponseContentPartDone$inboundSchema = _enum(TypeResponseContentPartDone);
var Part2$inboundSchema = union([
  ResponseOutputText$inboundSchema,
  ReasoningTextContent$inboundSchema,
  OpenAIResponsesRefusalContent$inboundSchema
]);
var OpenResponsesStreamEventResponseContentPartDone$inboundSchema = object({
  type: TypeResponseContentPartDone$inboundSchema,
  output_index: number2(),
  item_id: string2(),
  content_index: number2(),
  part: union([
    ResponseOutputText$inboundSchema,
    ReasoningTextContent$inboundSchema,
    OpenAIResponsesRefusalContent$inboundSchema
  ]),
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "output_index": "outputIndex",
    "item_id": "itemId",
    "content_index": "contentIndex",
    "sequence_number": "sequenceNumber"
  });
});
var TypeResponseContentPartAdded$inboundSchema = _enum(TypeResponseContentPartAdded);
var Part1$inboundSchema = union([
  ResponseOutputText$inboundSchema,
  ReasoningTextContent$inboundSchema,
  OpenAIResponsesRefusalContent$inboundSchema
]);
var OpenResponsesStreamEventResponseContentPartAdded$inboundSchema = object({
  type: TypeResponseContentPartAdded$inboundSchema,
  output_index: number2(),
  item_id: string2(),
  content_index: number2(),
  part: union([
    ResponseOutputText$inboundSchema,
    ReasoningTextContent$inboundSchema,
    OpenAIResponsesRefusalContent$inboundSchema
  ]),
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "output_index": "outputIndex",
    "item_id": "itemId",
    "content_index": "contentIndex",
    "sequence_number": "sequenceNumber"
  });
});
var TypeResponseOutputItemDone$inboundSchema = _enum(TypeResponseOutputItemDone);
var OpenResponsesStreamEventResponseOutputItemDone$inboundSchema = object({
  type: TypeResponseOutputItemDone$inboundSchema,
  output_index: number2(),
  item: ResponsesOutputItem$inboundSchema,
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "output_index": "outputIndex",
    "sequence_number": "sequenceNumber"
  });
});
var TypeResponseOutputItemAdded$inboundSchema = _enum(TypeResponseOutputItemAdded);
var OpenResponsesStreamEventResponseOutputItemAdded$inboundSchema = object({
  type: TypeResponseOutputItemAdded$inboundSchema,
  output_index: number2(),
  item: ResponsesOutputItem$inboundSchema,
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "output_index": "outputIndex",
    "sequence_number": "sequenceNumber"
  });
});
var TypeResponseFailed$inboundSchema = _enum(TypeResponseFailed);
var OpenResponsesStreamEventResponseFailed$inboundSchema = object({
  type: TypeResponseFailed$inboundSchema,
  response: OpenResponsesNonStreamingResponse$inboundSchema,
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "sequence_number": "sequenceNumber"
  });
});
var TypeResponseIncomplete$inboundSchema = _enum(TypeResponseIncomplete);
var OpenResponsesStreamEventResponseIncomplete$inboundSchema = object({
  type: TypeResponseIncomplete$inboundSchema,
  response: OpenResponsesNonStreamingResponse$inboundSchema,
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "sequence_number": "sequenceNumber"
  });
});
var TypeResponseCompleted$inboundSchema = _enum(TypeResponseCompleted);
var OpenResponsesStreamEventResponseCompleted$inboundSchema = object({
  type: TypeResponseCompleted$inboundSchema,
  response: OpenResponsesNonStreamingResponse$inboundSchema,
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "sequence_number": "sequenceNumber"
  });
});
var TypeResponseInProgress$inboundSchema = _enum(TypeResponseInProgress);
var OpenResponsesStreamEventResponseInProgress$inboundSchema = object({
  type: TypeResponseInProgress$inboundSchema,
  response: OpenResponsesNonStreamingResponse$inboundSchema,
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "sequence_number": "sequenceNumber"
  });
});
var TypeResponseCreated$inboundSchema = _enum(TypeResponseCreated);
var OpenResponsesStreamEventResponseCreated$inboundSchema = object({
  type: TypeResponseCreated$inboundSchema,
  response: OpenResponsesNonStreamingResponse$inboundSchema,
  sequence_number: number2()
}).transform((v) => {
  return remap(v, {
    "sequence_number": "sequenceNumber"
  });
});
var OpenResponsesStreamEvent$inboundSchema = union([
  lazy(() => OpenResponsesStreamEventResponseOutputTextDelta$inboundSchema),
  lazy(() => OpenResponsesStreamEventResponseOutputTextDone$inboundSchema),
  lazy(() => OpenResponsesStreamEventResponseOutputTextAnnotationAdded$inboundSchema),
  lazy(() => OpenResponsesStreamEventResponseContentPartAdded$inboundSchema),
  lazy(() => OpenResponsesStreamEventResponseContentPartDone$inboundSchema),
  lazy(() => OpenResponsesStreamEventResponseRefusalDelta$inboundSchema),
  lazy(() => OpenResponsesStreamEventResponseRefusalDone$inboundSchema),
  lazy(() => OpenResponsesStreamEventResponseFunctionCallArgumentsDone$inboundSchema),
  OpenResponsesReasoningDeltaEvent$inboundSchema,
  OpenResponsesReasoningDoneEvent$inboundSchema,
  OpenResponsesReasoningSummaryPartAddedEvent$inboundSchema,
  lazy(() => OpenResponsesStreamEventResponseReasoningSummaryPartDone$inboundSchema),
  OpenResponsesReasoningSummaryTextDeltaEvent$inboundSchema,
  OpenResponsesReasoningSummaryTextDoneEvent$inboundSchema,
  OpenResponsesImageGenCallPartialImage$inboundSchema,
  OpenResponsesErrorEvent$inboundSchema,
  lazy(() => OpenResponsesStreamEventResponseFunctionCallArgumentsDelta$inboundSchema),
  lazy(() => OpenResponsesStreamEventResponseOutputItemAdded$inboundSchema),
  lazy(() => OpenResponsesStreamEventResponseOutputItemDone$inboundSchema),
  OpenResponsesImageGenCallInProgress$inboundSchema,
  OpenResponsesImageGenCallGenerating$inboundSchema,
  OpenResponsesImageGenCallCompleted$inboundSchema,
  lazy(() => OpenResponsesStreamEventResponseCreated$inboundSchema),
  lazy(() => OpenResponsesStreamEventResponseInProgress$inboundSchema),
  lazy(() => OpenResponsesStreamEventResponseCompleted$inboundSchema),
  lazy(() => OpenResponsesStreamEventResponseIncomplete$inboundSchema),
  lazy(() => OpenResponsesStreamEventResponseFailed$inboundSchema)
]);

// node_modules/@openrouter/sdk/esm/models/payloadtoolargeresponseerrordata.js
var PayloadTooLargeResponseErrorData$inboundSchema = object({
  code: int(),
  message: string2(),
  metadata: nullable(record(string2(), nullable(any()))).optional()
});

// node_modules/@openrouter/sdk/esm/models/paymentrequiredresponseerrordata.js
var PaymentRequiredResponseErrorData$inboundSchema = object({
  code: int(),
  message: string2(),
  metadata: nullable(record(string2(), nullable(any()))).optional()
});

// node_modules/@openrouter/sdk/esm/models/provideroverloadedresponseerrordata.js
var ProviderOverloadedResponseErrorData$inboundSchema = object({
  code: int(),
  message: string2(),
  metadata: nullable(record(string2(), nullable(any()))).optional()
});

// node_modules/@openrouter/sdk/esm/models/requesttimeoutresponseerrordata.js
var RequestTimeoutResponseErrorData$inboundSchema = object({
  code: int(),
  message: string2(),
  metadata: nullable(record(string2(), nullable(any()))).optional()
});

// node_modules/@openrouter/sdk/esm/models/serviceunavailableresponseerrordata.js
var ServiceUnavailableResponseErrorData$inboundSchema = object({
  code: int(),
  message: string2(),
  metadata: nullable(record(string2(), nullable(any()))).optional()
});

// node_modules/@openrouter/sdk/esm/models/toomanyrequestsresponseerrordata.js
var TooManyRequestsResponseErrorData$inboundSchema = object({
  code: int(),
  message: string2(),
  metadata: nullable(record(string2(), nullable(any()))).optional()
});

// node_modules/@openrouter/sdk/esm/models/unauthorizedresponseerrordata.js
var UnauthorizedResponseErrorData$inboundSchema = object({
  code: int(),
  message: string2(),
  metadata: nullable(record(string2(), nullable(any()))).optional()
});

// node_modules/@openrouter/sdk/esm/models/unprocessableentityresponseerrordata.js
var UnprocessableEntityResponseErrorData$inboundSchema = object({
  code: int(),
  message: string2(),
  metadata: nullable(record(string2(), nullable(any()))).optional()
});

// node_modules/@openrouter/sdk/esm/models/errors/badgatewayresponseerror.js
var BadGatewayResponseError = class extends OpenRouterError {
  constructor(err, httpMeta) {
    var _a2;
    const message = ((_a2 = err.error) == null ? void 0 : _a2.message) || `API error occurred: ${JSON.stringify(err)}`;
    super(message, httpMeta);
    this.data$ = err;
    this.error = err.error;
    if (err.userId != null)
      this.userId = err.userId;
    this.name = "BadGatewayResponseError";
  }
};
var BadGatewayResponseError$inboundSchema = object({
  error: BadGatewayResponseErrorData$inboundSchema,
  user_id: nullable(string2()).optional(),
  request$: custom((x) => x instanceof Request),
  response$: custom((x) => x instanceof Response),
  body$: string2()
}).transform((v) => {
  const remapped = remap(v, {
    "user_id": "userId"
  });
  return new BadGatewayResponseError(remapped, {
    request: v.request$,
    response: v.response$,
    body: v.body$
  });
});

// node_modules/@openrouter/sdk/esm/models/errors/badrequestresponseerror.js
var BadRequestResponseError = class extends OpenRouterError {
  constructor(err, httpMeta) {
    var _a2;
    const message = ((_a2 = err.error) == null ? void 0 : _a2.message) || `API error occurred: ${JSON.stringify(err)}`;
    super(message, httpMeta);
    this.data$ = err;
    this.error = err.error;
    if (err.userId != null)
      this.userId = err.userId;
    this.name = "BadRequestResponseError";
  }
};
var BadRequestResponseError$inboundSchema = object({
  error: BadRequestResponseErrorData$inboundSchema,
  user_id: nullable(string2()).optional(),
  request$: custom((x) => x instanceof Request),
  response$: custom((x) => x instanceof Response),
  body$: string2()
}).transform((v) => {
  const remapped = remap(v, {
    "user_id": "userId"
  });
  return new BadRequestResponseError(remapped, {
    request: v.request$,
    response: v.response$,
    body: v.body$
  });
});

// node_modules/@openrouter/sdk/esm/models/errors/chaterror.js
var ChatError = class extends OpenRouterError {
  constructor(err, httpMeta) {
    var _a2;
    const message = ((_a2 = err.error) == null ? void 0 : _a2.message) || `API error occurred: ${JSON.stringify(err)}`;
    super(message, httpMeta);
    this.data$ = err;
    this.error = err.error;
    this.name = "ChatError";
  }
};
var ChatError$inboundSchema = object({
  error: lazy(() => ChatErrorError$inboundSchema),
  request$: custom((x) => x instanceof Request),
  response$: custom((x) => x instanceof Response),
  body$: string2()
}).transform((v) => {
  return new ChatError(v, {
    request: v.request$,
    response: v.response$,
    body: v.body$
  });
});

// node_modules/@openrouter/sdk/esm/models/errors/edgenetworktimeoutresponseerror.js
var EdgeNetworkTimeoutResponseError = class extends OpenRouterError {
  constructor(err, httpMeta) {
    var _a2;
    const message = ((_a2 = err.error) == null ? void 0 : _a2.message) || `API error occurred: ${JSON.stringify(err)}`;
    super(message, httpMeta);
    this.data$ = err;
    this.error = err.error;
    if (err.userId != null)
      this.userId = err.userId;
    this.name = "EdgeNetworkTimeoutResponseError";
  }
};
var EdgeNetworkTimeoutResponseError$inboundSchema = object({
  error: EdgeNetworkTimeoutResponseErrorData$inboundSchema,
  user_id: nullable(string2()).optional(),
  request$: custom((x) => x instanceof Request),
  response$: custom((x) => x instanceof Response),
  body$: string2()
}).transform((v) => {
  const remapped = remap(v, {
    "user_id": "userId"
  });
  return new EdgeNetworkTimeoutResponseError(remapped, {
    request: v.request$,
    response: v.response$,
    body: v.body$
  });
});

// node_modules/@openrouter/sdk/esm/models/errors/forbiddenresponseerror.js
var ForbiddenResponseError = class extends OpenRouterError {
  constructor(err, httpMeta) {
    var _a2;
    const message = ((_a2 = err.error) == null ? void 0 : _a2.message) || `API error occurred: ${JSON.stringify(err)}`;
    super(message, httpMeta);
    this.data$ = err;
    this.error = err.error;
    if (err.userId != null)
      this.userId = err.userId;
    this.name = "ForbiddenResponseError";
  }
};
var ForbiddenResponseError$inboundSchema = object({
  error: ForbiddenResponseErrorData$inboundSchema,
  user_id: nullable(string2()).optional(),
  request$: custom((x) => x instanceof Request),
  response$: custom((x) => x instanceof Response),
  body$: string2()
}).transform((v) => {
  const remapped = remap(v, {
    "user_id": "userId"
  });
  return new ForbiddenResponseError(remapped, {
    request: v.request$,
    response: v.response$,
    body: v.body$
  });
});

// node_modules/@openrouter/sdk/esm/models/errors/internalserverresponseerror.js
var InternalServerResponseError = class extends OpenRouterError {
  constructor(err, httpMeta) {
    var _a2;
    const message = ((_a2 = err.error) == null ? void 0 : _a2.message) || `API error occurred: ${JSON.stringify(err)}`;
    super(message, httpMeta);
    this.data$ = err;
    this.error = err.error;
    if (err.userId != null)
      this.userId = err.userId;
    this.name = "InternalServerResponseError";
  }
};
var InternalServerResponseError$inboundSchema = object({
  error: InternalServerResponseErrorData$inboundSchema,
  user_id: nullable(string2()).optional(),
  request$: custom((x) => x instanceof Request),
  response$: custom((x) => x instanceof Response),
  body$: string2()
}).transform((v) => {
  const remapped = remap(v, {
    "user_id": "userId"
  });
  return new InternalServerResponseError(remapped, {
    request: v.request$,
    response: v.response$,
    body: v.body$
  });
});

// node_modules/@openrouter/sdk/esm/models/errors/notfoundresponseerror.js
var NotFoundResponseError = class extends OpenRouterError {
  constructor(err, httpMeta) {
    var _a2;
    const message = ((_a2 = err.error) == null ? void 0 : _a2.message) || `API error occurred: ${JSON.stringify(err)}`;
    super(message, httpMeta);
    this.data$ = err;
    this.error = err.error;
    if (err.userId != null)
      this.userId = err.userId;
    this.name = "NotFoundResponseError";
  }
};
var NotFoundResponseError$inboundSchema = object({
  error: NotFoundResponseErrorData$inboundSchema,
  user_id: nullable(string2()).optional(),
  request$: custom((x) => x instanceof Request),
  response$: custom((x) => x instanceof Response),
  body$: string2()
}).transform((v) => {
  const remapped = remap(v, {
    "user_id": "userId"
  });
  return new NotFoundResponseError(remapped, {
    request: v.request$,
    response: v.response$,
    body: v.body$
  });
});

// node_modules/@openrouter/sdk/esm/models/errors/payloadtoolargeresponseerror.js
var PayloadTooLargeResponseError = class extends OpenRouterError {
  constructor(err, httpMeta) {
    var _a2;
    const message = ((_a2 = err.error) == null ? void 0 : _a2.message) || `API error occurred: ${JSON.stringify(err)}`;
    super(message, httpMeta);
    this.data$ = err;
    this.error = err.error;
    if (err.userId != null)
      this.userId = err.userId;
    this.name = "PayloadTooLargeResponseError";
  }
};
var PayloadTooLargeResponseError$inboundSchema = object({
  error: PayloadTooLargeResponseErrorData$inboundSchema,
  user_id: nullable(string2()).optional(),
  request$: custom((x) => x instanceof Request),
  response$: custom((x) => x instanceof Response),
  body$: string2()
}).transform((v) => {
  const remapped = remap(v, {
    "user_id": "userId"
  });
  return new PayloadTooLargeResponseError(remapped, {
    request: v.request$,
    response: v.response$,
    body: v.body$
  });
});

// node_modules/@openrouter/sdk/esm/models/errors/paymentrequiredresponseerror.js
var PaymentRequiredResponseError = class extends OpenRouterError {
  constructor(err, httpMeta) {
    var _a2;
    const message = ((_a2 = err.error) == null ? void 0 : _a2.message) || `API error occurred: ${JSON.stringify(err)}`;
    super(message, httpMeta);
    this.data$ = err;
    this.error = err.error;
    if (err.userId != null)
      this.userId = err.userId;
    this.name = "PaymentRequiredResponseError";
  }
};
var PaymentRequiredResponseError$inboundSchema = object({
  error: PaymentRequiredResponseErrorData$inboundSchema,
  user_id: nullable(string2()).optional(),
  request$: custom((x) => x instanceof Request),
  response$: custom((x) => x instanceof Response),
  body$: string2()
}).transform((v) => {
  const remapped = remap(v, {
    "user_id": "userId"
  });
  return new PaymentRequiredResponseError(remapped, {
    request: v.request$,
    response: v.response$,
    body: v.body$
  });
});

// node_modules/@openrouter/sdk/esm/models/errors/provideroverloadedresponseerror.js
var ProviderOverloadedResponseError = class extends OpenRouterError {
  constructor(err, httpMeta) {
    var _a2;
    const message = ((_a2 = err.error) == null ? void 0 : _a2.message) || `API error occurred: ${JSON.stringify(err)}`;
    super(message, httpMeta);
    this.data$ = err;
    this.error = err.error;
    if (err.userId != null)
      this.userId = err.userId;
    this.name = "ProviderOverloadedResponseError";
  }
};
var ProviderOverloadedResponseError$inboundSchema = object({
  error: ProviderOverloadedResponseErrorData$inboundSchema,
  user_id: nullable(string2()).optional(),
  request$: custom((x) => x instanceof Request),
  response$: custom((x) => x instanceof Response),
  body$: string2()
}).transform((v) => {
  const remapped = remap(v, {
    "user_id": "userId"
  });
  return new ProviderOverloadedResponseError(remapped, {
    request: v.request$,
    response: v.response$,
    body: v.body$
  });
});

// node_modules/@openrouter/sdk/esm/models/errors/requesttimeoutresponseerror.js
var RequestTimeoutResponseError = class extends OpenRouterError {
  constructor(err, httpMeta) {
    var _a2;
    const message = ((_a2 = err.error) == null ? void 0 : _a2.message) || `API error occurred: ${JSON.stringify(err)}`;
    super(message, httpMeta);
    this.data$ = err;
    this.error = err.error;
    if (err.userId != null)
      this.userId = err.userId;
    this.name = "RequestTimeoutResponseError";
  }
};
var RequestTimeoutResponseError$inboundSchema = object({
  error: RequestTimeoutResponseErrorData$inboundSchema,
  user_id: nullable(string2()).optional(),
  request$: custom((x) => x instanceof Request),
  response$: custom((x) => x instanceof Response),
  body$: string2()
}).transform((v) => {
  const remapped = remap(v, {
    "user_id": "userId"
  });
  return new RequestTimeoutResponseError(remapped, {
    request: v.request$,
    response: v.response$,
    body: v.body$
  });
});

// node_modules/@openrouter/sdk/esm/models/errors/serviceunavailableresponseerror.js
var ServiceUnavailableResponseError = class extends OpenRouterError {
  constructor(err, httpMeta) {
    var _a2;
    const message = ((_a2 = err.error) == null ? void 0 : _a2.message) || `API error occurred: ${JSON.stringify(err)}`;
    super(message, httpMeta);
    this.data$ = err;
    this.error = err.error;
    if (err.userId != null)
      this.userId = err.userId;
    this.name = "ServiceUnavailableResponseError";
  }
};
var ServiceUnavailableResponseError$inboundSchema = object({
  error: ServiceUnavailableResponseErrorData$inboundSchema,
  user_id: nullable(string2()).optional(),
  request$: custom((x) => x instanceof Request),
  response$: custom((x) => x instanceof Response),
  body$: string2()
}).transform((v) => {
  const remapped = remap(v, {
    "user_id": "userId"
  });
  return new ServiceUnavailableResponseError(remapped, {
    request: v.request$,
    response: v.response$,
    body: v.body$
  });
});

// node_modules/@openrouter/sdk/esm/models/errors/toomanyrequestsresponseerror.js
var TooManyRequestsResponseError = class extends OpenRouterError {
  constructor(err, httpMeta) {
    var _a2;
    const message = ((_a2 = err.error) == null ? void 0 : _a2.message) || `API error occurred: ${JSON.stringify(err)}`;
    super(message, httpMeta);
    this.data$ = err;
    this.error = err.error;
    if (err.userId != null)
      this.userId = err.userId;
    this.name = "TooManyRequestsResponseError";
  }
};
var TooManyRequestsResponseError$inboundSchema = object({
  error: TooManyRequestsResponseErrorData$inboundSchema,
  user_id: nullable(string2()).optional(),
  request$: custom((x) => x instanceof Request),
  response$: custom((x) => x instanceof Response),
  body$: string2()
}).transform((v) => {
  const remapped = remap(v, {
    "user_id": "userId"
  });
  return new TooManyRequestsResponseError(remapped, {
    request: v.request$,
    response: v.response$,
    body: v.body$
  });
});

// node_modules/@openrouter/sdk/esm/models/errors/unauthorizedresponseerror.js
var UnauthorizedResponseError = class extends OpenRouterError {
  constructor(err, httpMeta) {
    var _a2;
    const message = ((_a2 = err.error) == null ? void 0 : _a2.message) || `API error occurred: ${JSON.stringify(err)}`;
    super(message, httpMeta);
    this.data$ = err;
    this.error = err.error;
    if (err.userId != null)
      this.userId = err.userId;
    this.name = "UnauthorizedResponseError";
  }
};
var UnauthorizedResponseError$inboundSchema = object({
  error: UnauthorizedResponseErrorData$inboundSchema,
  user_id: nullable(string2()).optional(),
  request$: custom((x) => x instanceof Request),
  response$: custom((x) => x instanceof Response),
  body$: string2()
}).transform((v) => {
  const remapped = remap(v, {
    "user_id": "userId"
  });
  return new UnauthorizedResponseError(remapped, {
    request: v.request$,
    response: v.response$,
    body: v.body$
  });
});

// node_modules/@openrouter/sdk/esm/models/errors/unprocessableentityresponseerror.js
var UnprocessableEntityResponseError = class extends OpenRouterError {
  constructor(err, httpMeta) {
    var _a2;
    const message = ((_a2 = err.error) == null ? void 0 : _a2.message) || `API error occurred: ${JSON.stringify(err)}`;
    super(message, httpMeta);
    this.data$ = err;
    this.error = err.error;
    if (err.userId != null)
      this.userId = err.userId;
    this.name = "UnprocessableEntityResponseError";
  }
};
var UnprocessableEntityResponseError$inboundSchema = object({
  error: UnprocessableEntityResponseErrorData$inboundSchema,
  user_id: nullable(string2()).optional(),
  request$: custom((x) => x instanceof Request),
  response$: custom((x) => x instanceof Response),
  body$: string2()
}).transform((v) => {
  const remapped = remap(v, {
    "user_id": "userId"
  });
  return new UnprocessableEntityResponseError(remapped, {
    request: v.request$,
    response: v.response$,
    body: v.body$
  });
});

// node_modules/@openrouter/sdk/esm/models/operations/createauthkeyscode.js
var CreateAuthKeysCodeCodeChallengeMethod = {
  S256: "S256",
  Plain: "plain"
};
var CreateAuthKeysCodeCodeChallengeMethod$outboundSchema = union([
  _enum(CreateAuthKeysCodeCodeChallengeMethod),
  string2().and(custom())
]);
var CreateAuthKeysCodeRequest$outboundSchema = object({
  callbackUrl: string2(),
  codeChallenge: string2().optional(),
  codeChallengeMethod: CreateAuthKeysCodeCodeChallengeMethod$outboundSchema.optional(),
  limit: number2().optional(),
  expiresAt: nullable(date3().transform((v) => v.toISOString())).optional()
}).transform((v) => {
  return remap(v, {
    callbackUrl: "callback_url",
    codeChallenge: "code_challenge",
    codeChallengeMethod: "code_challenge_method",
    expiresAt: "expires_at"
  });
});
var CreateAuthKeysCodeData$inboundSchema = object({
  id: string2(),
  app_id: number2(),
  created_at: string2()
}).transform((v) => {
  return remap(v, {
    "app_id": "appId",
    "created_at": "createdAt"
  });
});
var CreateAuthKeysCodeResponse$inboundSchema = object({
  data: lazy(() => CreateAuthKeysCodeData$inboundSchema)
});

// node_modules/@openrouter/sdk/esm/models/operations/createcoinbasecharge.js
var CreateCoinbaseChargeSecurity$outboundSchema = object({
  bearer: string2()
});
var CallData$inboundSchema = object({
  deadline: string2(),
  fee_amount: string2(),
  id: string2(),
  operator: string2(),
  prefix: string2(),
  recipient: string2(),
  recipient_amount: string2(),
  recipient_currency: string2(),
  refund_destination: string2(),
  signature: string2()
}).transform((v) => {
  return remap(v, {
    "fee_amount": "feeAmount",
    "recipient_amount": "recipientAmount",
    "recipient_currency": "recipientCurrency",
    "refund_destination": "refundDestination"
  });
});
var Metadata$inboundSchema = object({
  chain_id: number2(),
  contract_address: string2(),
  sender: string2()
}).transform((v) => {
  return remap(v, {
    "chain_id": "chainId",
    "contract_address": "contractAddress"
  });
});
var TransferIntent$inboundSchema = object({
  call_data: lazy(() => CallData$inboundSchema),
  metadata: lazy(() => Metadata$inboundSchema)
}).transform((v) => {
  return remap(v, {
    "call_data": "callData"
  });
});
var Web3Data$inboundSchema = object({
  transfer_intent: lazy(() => TransferIntent$inboundSchema)
}).transform((v) => {
  return remap(v, {
    "transfer_intent": "transferIntent"
  });
});
var CreateCoinbaseChargeData$inboundSchema = object({
  id: string2(),
  created_at: string2(),
  expires_at: string2(),
  web3_data: lazy(() => Web3Data$inboundSchema)
}).transform((v) => {
  return remap(v, {
    "created_at": "createdAt",
    "expires_at": "expiresAt",
    "web3_data": "web3Data"
  });
});
var CreateCoinbaseChargeResponse$inboundSchema = object({
  data: lazy(() => CreateCoinbaseChargeData$inboundSchema)
});

// node_modules/@openrouter/sdk/esm/models/operations/createembeddings.js
var DataCollection2 = {
  Deny: "deny",
  Allow: "allow"
};
var Sort2 = {
  Price: "price",
  Throughput: "throughput",
  Latency: "latency"
};
var EncodingFormatBase64 = {
  Base64: "base64"
};
var EncodingFormatFloat = {
  Float: "float"
};
var ObjectT2 = {
  List: "list"
};
var ObjectEmbedding = {
  Embedding: "embedding"
};
var Input$outboundSchema = union([
  string2(),
  array(string2()),
  array(number2()),
  array(array(number2()))
]);
var DataCollection$outboundSchema2 = union([
  _enum(DataCollection2),
  string2().and(custom())
]);
var Order$outboundSchema2 = union([
  ProviderName$outboundSchema,
  string2()
]);
var Only$outboundSchema2 = union([
  ProviderName$outboundSchema,
  string2()
]);
var Ignore$outboundSchema2 = union([ProviderName$outboundSchema, string2()]);
var Sort$outboundSchema2 = union([
  _enum(Sort2),
  string2().and(custom())
]);
var MaxPrice$outboundSchema2 = object({
  prompt: any().optional(),
  completion: any().optional(),
  image: any().optional(),
  audio: any().optional(),
  request: any().optional()
});
var CreateEmbeddingsProvider$outboundSchema = object({
  allowFallbacks: nullable(boolean2()).optional(),
  requireParameters: nullable(boolean2()).optional(),
  dataCollection: nullable(DataCollection$outboundSchema2).optional(),
  zdr: nullable(boolean2()).optional(),
  enforceDistillableText: nullable(boolean2()).optional(),
  order: nullable(array(union([ProviderName$outboundSchema, string2()]))).optional(),
  only: nullable(array(union([ProviderName$outboundSchema, string2()]))).optional(),
  ignore: nullable(array(union([ProviderName$outboundSchema, string2()]))).optional(),
  quantizations: nullable(array(Quantization$outboundSchema)).optional(),
  sort: nullable(Sort$outboundSchema2).optional(),
  maxPrice: lazy(() => MaxPrice$outboundSchema2).optional()
}).transform((v) => {
  return remap(v, {
    allowFallbacks: "allow_fallbacks",
    requireParameters: "require_parameters",
    dataCollection: "data_collection",
    enforceDistillableText: "enforce_distillable_text",
    maxPrice: "max_price"
  });
});
var EncodingFormatBase64$outboundSchema = _enum(EncodingFormatBase64);
var EncodingFormatFloat$outboundSchema = _enum(EncodingFormatFloat);
var EncodingFormat$outboundSchema = union([
  EncodingFormatFloat$outboundSchema,
  EncodingFormatBase64$outboundSchema
]);
var CreateEmbeddingsRequest$outboundSchema = object({
  input: union([
    string2(),
    array(string2()),
    array(number2()),
    array(array(number2()))
  ]),
  model: string2(),
  provider: lazy(() => CreateEmbeddingsProvider$outboundSchema).optional(),
  encodingFormat: union([
    EncodingFormatFloat$outboundSchema,
    EncodingFormatBase64$outboundSchema
  ]).optional(),
  user: string2().optional()
}).transform((v) => {
  return remap(v, {
    encodingFormat: "encoding_format"
  });
});
var ObjectT$inboundSchema2 = _enum(ObjectT2);
var ObjectEmbedding$inboundSchema = _enum(ObjectEmbedding);
var Embedding$inboundSchema = union([
  array(number2()),
  string2()
]);
var CreateEmbeddingsData$inboundSchema = object({
  object: ObjectEmbedding$inboundSchema,
  embedding: union([array(number2()), string2()]),
  index: number2().optional()
});
var Usage$inboundSchema = object({
  prompt_tokens: number2(),
  total_tokens: number2(),
  cost: number2().optional()
}).transform((v) => {
  return remap(v, {
    "prompt_tokens": "promptTokens",
    "total_tokens": "totalTokens"
  });
});
var CreateEmbeddingsResponseBody$inboundSchema = object({
  id: string2().optional(),
  object: ObjectT$inboundSchema2,
  data: array(lazy(() => CreateEmbeddingsData$inboundSchema)),
  model: string2(),
  usage: lazy(() => Usage$inboundSchema).optional()
});
var CreateEmbeddingsResponse$inboundSchema = union([
  lazy(() => CreateEmbeddingsResponseBody$inboundSchema),
  string2()
]);

// node_modules/@openrouter/sdk/esm/models/operations/createkeys.js
var CreateKeysLimitReset = {
  Daily: "daily",
  Weekly: "weekly",
  Monthly: "monthly"
};
var CreateKeysLimitReset$outboundSchema = union([
  _enum(CreateKeysLimitReset),
  string2().and(custom())
]);
var CreateKeysRequest$outboundSchema = object({
  name: string2(),
  limit: nullable(number2()).optional(),
  limitReset: nullable(CreateKeysLimitReset$outboundSchema).optional(),
  includeByokInLimit: boolean2().optional(),
  expiresAt: nullable(date3().transform((v) => v.toISOString())).optional()
}).transform((v) => {
  return remap(v, {
    limitReset: "limit_reset",
    includeByokInLimit: "include_byok_in_limit",
    expiresAt: "expires_at"
  });
});
var CreateKeysData$inboundSchema = object({
  hash: string2(),
  name: string2(),
  label: string2(),
  disabled: boolean2(),
  limit: nullable(number2()),
  limit_remaining: nullable(number2()),
  limit_reset: nullable(string2()),
  include_byok_in_limit: boolean2(),
  usage: number2(),
  usage_daily: number2(),
  usage_weekly: number2(),
  usage_monthly: number2(),
  byok_usage: number2(),
  byok_usage_daily: number2(),
  byok_usage_weekly: number2(),
  byok_usage_monthly: number2(),
  created_at: string2(),
  updated_at: nullable(string2()),
  expires_at: nullable(string2().datetime({ offset: true }).transform((v) => new Date(v))).optional()
}).transform((v) => {
  return remap(v, {
    "limit_remaining": "limitRemaining",
    "limit_reset": "limitReset",
    "include_byok_in_limit": "includeByokInLimit",
    "usage_daily": "usageDaily",
    "usage_weekly": "usageWeekly",
    "usage_monthly": "usageMonthly",
    "byok_usage": "byokUsage",
    "byok_usage_daily": "byokUsageDaily",
    "byok_usage_weekly": "byokUsageWeekly",
    "byok_usage_monthly": "byokUsageMonthly",
    "created_at": "createdAt",
    "updated_at": "updatedAt",
    "expires_at": "expiresAt"
  });
});
var CreateKeysResponse$inboundSchema = object({
  data: lazy(() => CreateKeysData$inboundSchema),
  key: string2()
});

// node_modules/@openrouter/sdk/esm/lib/event-streams.js
var EventStream = class extends ReadableStream {
  constructor(responseBody, parse3) {
    const upstream = responseBody.getReader();
    let buffer = new Uint8Array();
    super({
      async pull(downstream) {
        try {
          while (true) {
            const match2 = findBoundary(buffer);
            if (!match2) {
              const chunk = await upstream.read();
              if (chunk.done)
                return downstream.close();
              buffer = concatBuffer(buffer, chunk.value);
              continue;
            }
            const message = buffer.slice(0, match2.index);
            buffer = buffer.slice(match2.index + match2.length);
            const item = parseMessage(message, parse3);
            if (item == null ? void 0 : item.value)
              return downstream.enqueue(item.value);
            if (item == null ? void 0 : item.done) {
              await upstream.cancel("done");
              return downstream.close();
            }
          }
        } catch (e) {
          downstream.error(e);
          await upstream.cancel(e);
        }
      },
      cancel: (reason) => upstream.cancel(reason)
    });
  }
  // Polyfill for older browsers
  [Symbol.asyncIterator]() {
    const fn = ReadableStream.prototype[Symbol.asyncIterator];
    if (typeof fn === "function")
      return fn.call(this);
    const reader = this.getReader();
    return {
      next: async () => {
        const r = await reader.read();
        if (r.done) {
          reader.releaseLock();
          return { done: true, value: void 0 };
        }
        return { done: false, value: r.value };
      },
      throw: async (e) => {
        await reader.cancel(e);
        reader.releaseLock();
        return { done: true, value: void 0 };
      },
      return: async () => {
        await reader.cancel("done");
        reader.releaseLock();
        return { done: true, value: void 0 };
      },
      [Symbol.asyncIterator]() {
        return this;
      }
    };
  }
};
function concatBuffer(a, b) {
  const c = new Uint8Array(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}
function findBoundary(buf) {
  const len = buf.length;
  for (let i = 0; i < len; i++) {
    if (i <= len - 4 && buf[i] === 13 && buf[i + 1] === 10 && buf[i + 2] === 13 && buf[i + 3] === 10) {
      return { index: i, length: 4 };
    }
    if (i <= len - 2 && buf[i] === 13 && buf[i + 1] === 13) {
      return { index: i, length: 2 };
    }
    if (i <= len - 2 && buf[i] === 10 && buf[i + 1] === 10) {
      return { index: i, length: 2 };
    }
  }
  return null;
}
function parseMessage(chunk, parse3) {
  const text2 = new TextDecoder().decode(chunk);
  const lines = text2.split(/\r\n|\r|\n/);
  const dataLines = [];
  const ret = {};
  let ignore = true;
  for (const line of lines) {
    if (!line || line.startsWith(":"))
      continue;
    ignore = false;
    const i = line.indexOf(":");
    const field = line.slice(0, i);
    const value = line[i + 1] === " " ? line.slice(i + 2) : line.slice(i + 1);
    if (field === "data")
      dataLines.push(value);
    else if (field === "event")
      ret.event = value;
    else if (field === "id")
      ret.id = value;
    else if (field === "retry") {
      const n = Number(value);
      if (!isNaN(n))
        ret.retry = n;
    }
  }
  if (ignore)
    return;
  if (dataLines.length)
    ret.data = dataLines.join("\n");
  return parse3(ret);
}

// node_modules/@openrouter/sdk/esm/models/operations/createresponses.js
var CreateResponsesResponseBody$inboundSchema = object({
  data: string2().transform((v, ctx) => {
    try {
      return JSON.parse(v);
    } catch (err) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: `malformed json: ${err}`
      });
      return NEVER;
    }
  }).pipe(OpenResponsesStreamEvent$inboundSchema)
});
var CreateResponsesResponse$inboundSchema = union([
  OpenResponsesNonStreamingResponse$inboundSchema,
  custom((x) => x instanceof ReadableStream).transform((stream) => {
    return new EventStream(stream, (rawEvent) => {
      var _a2;
      if (rawEvent.data === "[DONE]")
        return { done: true };
      return {
        value: (_a2 = lazy(() => CreateResponsesResponseBody$inboundSchema).parse(rawEvent)) == null ? void 0 : _a2.data
      };
    });
  })
]);

// node_modules/@openrouter/sdk/esm/models/operations/deletekeys.js
var DeleteKeysRequest$outboundSchema = object({
  hash: string2()
});
var DeleteKeysResponse$inboundSchema = object({
  deleted: literal(true)
});

// node_modules/@openrouter/sdk/esm/models/operations/exchangeauthcodeforapikey.js
var ExchangeAuthCodeForAPIKeyCodeChallengeMethod = {
  S256: "S256",
  Plain: "plain"
};
var ExchangeAuthCodeForAPIKeyCodeChallengeMethod$outboundSchema = union([
  _enum(ExchangeAuthCodeForAPIKeyCodeChallengeMethod),
  string2().and(custom())
]);
var ExchangeAuthCodeForAPIKeyRequest$outboundSchema = object({
  code: string2(),
  codeVerifier: string2().optional(),
  codeChallengeMethod: nullable(ExchangeAuthCodeForAPIKeyCodeChallengeMethod$outboundSchema).optional()
}).transform((v) => {
  return remap(v, {
    codeVerifier: "code_verifier",
    codeChallengeMethod: "code_challenge_method"
  });
});
var ExchangeAuthCodeForAPIKeyResponse$inboundSchema = object({
  key: string2(),
  user_id: nullable(string2())
}).transform((v) => {
  return remap(v, {
    "user_id": "userId"
  });
});

// node_modules/@openrouter/sdk/esm/models/operations/getcredits.js
var GetCreditsResponse$inboundSchema = object({});

// node_modules/@openrouter/sdk/esm/models/operations/getcurrentkey.js
var RateLimit$inboundSchema = object({
  requests: number2(),
  interval: string2(),
  note: string2()
});
var GetCurrentKeyData$inboundSchema = object({
  label: string2(),
  limit: nullable(number2()),
  usage: number2(),
  usage_daily: number2(),
  usage_weekly: number2(),
  usage_monthly: number2(),
  byok_usage: number2(),
  byok_usage_daily: number2(),
  byok_usage_weekly: number2(),
  byok_usage_monthly: number2(),
  is_free_tier: boolean2(),
  is_provisioning_key: boolean2(),
  limit_remaining: nullable(number2()),
  limit_reset: nullable(string2()),
  include_byok_in_limit: boolean2(),
  rate_limit: lazy(() => RateLimit$inboundSchema)
}).transform((v) => {
  return remap(v, {
    "usage_daily": "usageDaily",
    "usage_weekly": "usageWeekly",
    "usage_monthly": "usageMonthly",
    "byok_usage": "byokUsage",
    "byok_usage_daily": "byokUsageDaily",
    "byok_usage_weekly": "byokUsageWeekly",
    "byok_usage_monthly": "byokUsageMonthly",
    "is_free_tier": "isFreeTier",
    "is_provisioning_key": "isProvisioningKey",
    "limit_remaining": "limitRemaining",
    "limit_reset": "limitReset",
    "include_byok_in_limit": "includeByokInLimit",
    "rate_limit": "rateLimit"
  });
});
var GetCurrentKeyResponse$inboundSchema = object({
  data: lazy(() => GetCurrentKeyData$inboundSchema)
});

// node_modules/@openrouter/sdk/esm/models/operations/getgeneration.js
var ApiType = {
  Completions: "completions",
  Embeddings: "embeddings"
};
var GetGenerationRequest$outboundSchema = object({
  id: string2()
});
var ApiType$inboundSchema = union([
  _enum(ApiType),
  string2().transform(catchUnrecognizedEnum)
]);
var GetGenerationData$inboundSchema = object({
  id: string2(),
  upstream_id: nullable(string2()),
  total_cost: number2(),
  cache_discount: nullable(number2()),
  upstream_inference_cost: nullable(number2()),
  created_at: string2(),
  model: string2(),
  app_id: nullable(number2()),
  streamed: nullable(boolean2()),
  cancelled: nullable(boolean2()),
  provider_name: nullable(string2()),
  latency: nullable(number2()),
  moderation_latency: nullable(number2()),
  generation_time: nullable(number2()),
  finish_reason: nullable(string2()),
  tokens_prompt: nullable(number2()),
  tokens_completion: nullable(number2()),
  native_tokens_prompt: nullable(number2()),
  native_tokens_completion: nullable(number2()),
  native_tokens_completion_images: nullable(number2()),
  native_tokens_reasoning: nullable(number2()),
  native_tokens_cached: nullable(number2()),
  num_media_prompt: nullable(number2()),
  num_input_audio_prompt: nullable(number2()),
  num_media_completion: nullable(number2()),
  num_search_results: nullable(number2()),
  origin: string2(),
  usage: number2(),
  is_byok: boolean2(),
  native_finish_reason: nullable(string2()),
  external_user: nullable(string2()),
  api_type: nullable(ApiType$inboundSchema)
}).transform((v) => {
  return remap(v, {
    "upstream_id": "upstreamId",
    "total_cost": "totalCost",
    "cache_discount": "cacheDiscount",
    "upstream_inference_cost": "upstreamInferenceCost",
    "created_at": "createdAt",
    "app_id": "appId",
    "provider_name": "providerName",
    "moderation_latency": "moderationLatency",
    "generation_time": "generationTime",
    "finish_reason": "finishReason",
    "tokens_prompt": "tokensPrompt",
    "tokens_completion": "tokensCompletion",
    "native_tokens_prompt": "nativeTokensPrompt",
    "native_tokens_completion": "nativeTokensCompletion",
    "native_tokens_completion_images": "nativeTokensCompletionImages",
    "native_tokens_reasoning": "nativeTokensReasoning",
    "native_tokens_cached": "nativeTokensCached",
    "num_media_prompt": "numMediaPrompt",
    "num_input_audio_prompt": "numInputAudioPrompt",
    "num_media_completion": "numMediaCompletion",
    "num_search_results": "numSearchResults",
    "is_byok": "isByok",
    "native_finish_reason": "nativeFinishReason",
    "external_user": "externalUser",
    "api_type": "apiType"
  });
});
var GetGenerationResponse$inboundSchema = object({
  data: lazy(() => GetGenerationData$inboundSchema)
});

// node_modules/@openrouter/sdk/esm/models/operations/getkey.js
var GetKeyRequest$outboundSchema = object({
  hash: string2()
});
var GetKeyData$inboundSchema = object({
  hash: string2(),
  name: string2(),
  label: string2(),
  disabled: boolean2(),
  limit: nullable(number2()),
  limit_remaining: nullable(number2()),
  limit_reset: nullable(string2()),
  include_byok_in_limit: boolean2(),
  usage: number2(),
  usage_daily: number2(),
  usage_weekly: number2(),
  usage_monthly: number2(),
  byok_usage: number2(),
  byok_usage_daily: number2(),
  byok_usage_weekly: number2(),
  byok_usage_monthly: number2(),
  created_at: string2(),
  updated_at: nullable(string2()),
  expires_at: nullable(string2().datetime({ offset: true }).transform((v) => new Date(v))).optional()
}).transform((v) => {
  return remap(v, {
    "limit_remaining": "limitRemaining",
    "limit_reset": "limitReset",
    "include_byok_in_limit": "includeByokInLimit",
    "usage_daily": "usageDaily",
    "usage_weekly": "usageWeekly",
    "usage_monthly": "usageMonthly",
    "byok_usage": "byokUsage",
    "byok_usage_daily": "byokUsageDaily",
    "byok_usage_weekly": "byokUsageWeekly",
    "byok_usage_monthly": "byokUsageMonthly",
    "created_at": "createdAt",
    "updated_at": "updatedAt",
    "expires_at": "expiresAt"
  });
});
var GetKeyResponse$inboundSchema = object({
  data: lazy(() => GetKeyData$inboundSchema)
});

// node_modules/@openrouter/sdk/esm/models/operations/getmodels.js
var GetModelsRequest$outboundSchema = object({
  category: string2().optional(),
  supportedParameters: string2().optional()
}).transform((v) => {
  return remap(v, {
    supportedParameters: "supported_parameters"
  });
});

// node_modules/@openrouter/sdk/esm/models/operations/getparameters.js
var GetParametersProvider = {
  Ai21: "AI21",
  AionLabs: "AionLabs",
  Alibaba: "Alibaba",
  AmazonBedrock: "Amazon Bedrock",
  Anthropic: "Anthropic",
  AtlasCloud: "AtlasCloud",
  Atoma: "Atoma",
  Avian: "Avian",
  Azure: "Azure",
  BaseTen: "BaseTen",
  Cerebras: "Cerebras",
  Chutes: "Chutes",
  Cirrascale: "Cirrascale",
  Clarifai: "Clarifai",
  Cloudflare: "Cloudflare",
  Cohere: "Cohere",
  CrofAI: "CrofAI",
  Crusoe: "Crusoe",
  DeepInfra: "DeepInfra",
  DeepSeek: "DeepSeek",
  Enfer: "Enfer",
  Featherless: "Featherless",
  Fireworks: "Fireworks",
  Friendli: "Friendli",
  GMICloud: "GMICloud",
  Google: "Google",
  GoogleAIStudio: "Google AI Studio",
  Groq: "Groq",
  Hyperbolic: "Hyperbolic",
  Inception: "Inception",
  InferenceNet: "InferenceNet",
  Infermatic: "Infermatic",
  Inflection: "Inflection",
  Kluster: "Kluster",
  Lambda: "Lambda",
  Liquid: "Liquid",
  Mancer2: "Mancer 2",
  Meta: "Meta",
  Minimax: "Minimax",
  ModelRun: "ModelRun",
  Mistral: "Mistral",
  Modular: "Modular",
  MoonshotAI: "Moonshot AI",
  Morph: "Morph",
  NCompass: "NCompass",
  Nebius: "Nebius",
  NextBit: "NextBit",
  Nineteen: "Nineteen",
  Novita: "Novita",
  Nvidia: "Nvidia",
  OpenAI: "OpenAI",
  OpenInference: "OpenInference",
  Parasail: "Parasail",
  Perplexity: "Perplexity",
  Phala: "Phala",
  Relace: "Relace",
  SambaNova: "SambaNova",
  SiliconFlow: "SiliconFlow",
  Stealth: "Stealth",
  Switchpoint: "Switchpoint",
  Targon: "Targon",
  Together: "Together",
  Ubicloud: "Ubicloud",
  Venice: "Venice",
  WandB: "WandB",
  XAI: "xAI",
  ZAi: "Z.AI",
  FakeProvider: "FakeProvider"
};
var SupportedParameter = {
  Temperature: "temperature",
  TopP: "top_p",
  TopK: "top_k",
  MinP: "min_p",
  TopA: "top_a",
  FrequencyPenalty: "frequency_penalty",
  PresencePenalty: "presence_penalty",
  RepetitionPenalty: "repetition_penalty",
  MaxTokens: "max_tokens",
  LogitBias: "logit_bias",
  Logprobs: "logprobs",
  TopLogprobs: "top_logprobs",
  Seed: "seed",
  ResponseFormat: "response_format",
  StructuredOutputs: "structured_outputs",
  Stop: "stop",
  Tools: "tools",
  ToolChoice: "tool_choice",
  ParallelToolCalls: "parallel_tool_calls",
  IncludeReasoning: "include_reasoning",
  Reasoning: "reasoning",
  WebSearchOptions: "web_search_options",
  Verbosity: "verbosity"
};
var GetParametersSecurity$outboundSchema = object({
  bearer: string2()
});
var GetParametersProvider$outboundSchema = union([
  _enum(GetParametersProvider),
  string2().and(custom())
]);
var GetParametersRequest$outboundSchema = object({
  author: string2(),
  slug: string2(),
  provider: GetParametersProvider$outboundSchema.optional()
});
var SupportedParameter$inboundSchema = union([
  _enum(SupportedParameter),
  string2().transform(catchUnrecognizedEnum)
]);
var GetParametersData$inboundSchema = object({
  model: string2(),
  supported_parameters: array(SupportedParameter$inboundSchema)
}).transform((v) => {
  return remap(v, {
    "supported_parameters": "supportedParameters"
  });
});
var GetParametersResponse$inboundSchema = object({
  data: lazy(() => GetParametersData$inboundSchema)
});

// node_modules/@openrouter/sdk/esm/models/operations/getuseractivity.js
var GetUserActivityRequest$outboundSchema = object({
  date: string2().optional()
});
var GetUserActivityResponse$inboundSchema = object({
  data: array(ActivityItem$inboundSchema)
});

// node_modules/@openrouter/sdk/esm/models/operations/list.js
var ListRequest$outboundSchema = object({
  includeDisabled: string2().optional(),
  offset: string2().optional()
}).transform((v) => {
  return remap(v, {
    includeDisabled: "include_disabled"
  });
});
var ListData$inboundSchema = object({
  hash: string2(),
  name: string2(),
  label: string2(),
  disabled: boolean2(),
  limit: nullable(number2()),
  limit_remaining: nullable(number2()),
  limit_reset: nullable(string2()),
  include_byok_in_limit: boolean2(),
  usage: number2(),
  usage_daily: number2(),
  usage_weekly: number2(),
  usage_monthly: number2(),
  byok_usage: number2(),
  byok_usage_daily: number2(),
  byok_usage_weekly: number2(),
  byok_usage_monthly: number2(),
  created_at: string2(),
  updated_at: nullable(string2()),
  expires_at: nullable(string2().datetime({ offset: true }).transform((v) => new Date(v))).optional()
}).transform((v) => {
  return remap(v, {
    "limit_remaining": "limitRemaining",
    "limit_reset": "limitReset",
    "include_byok_in_limit": "includeByokInLimit",
    "usage_daily": "usageDaily",
    "usage_weekly": "usageWeekly",
    "usage_monthly": "usageMonthly",
    "byok_usage": "byokUsage",
    "byok_usage_daily": "byokUsageDaily",
    "byok_usage_weekly": "byokUsageWeekly",
    "byok_usage_monthly": "byokUsageMonthly",
    "created_at": "createdAt",
    "updated_at": "updatedAt",
    "expires_at": "expiresAt"
  });
});
var ListResponse$inboundSchema = object({
  data: array(lazy(() => ListData$inboundSchema))
});

// node_modules/@openrouter/sdk/esm/models/operations/listendpoints.js
var ListEndpointsRequest$outboundSchema = object({
  author: string2(),
  slug: string2()
});
var ListEndpointsResponse$inboundSchema2 = object({
  data: ListEndpointsResponse$inboundSchema
});

// node_modules/@openrouter/sdk/esm/models/operations/listendpointszdr.js
var ListEndpointsZdrResponse$inboundSchema = object({
  data: array(PublicEndpoint$inboundSchema)
});

// node_modules/@openrouter/sdk/esm/models/operations/listproviders.js
var ListProvidersData$inboundSchema = object({
  name: string2(),
  slug: string2(),
  privacy_policy_url: nullable(string2()),
  terms_of_service_url: nullable(string2()).optional(),
  status_page_url: nullable(string2()).optional()
}).transform((v) => {
  return remap(v, {
    "privacy_policy_url": "privacyPolicyUrl",
    "terms_of_service_url": "termsOfServiceUrl",
    "status_page_url": "statusPageUrl"
  });
});
var ListProvidersResponse$inboundSchema = object({
  data: array(lazy(() => ListProvidersData$inboundSchema))
});

// node_modules/@openrouter/sdk/esm/models/operations/sendchatcompletionrequest.js
var SendChatCompletionRequestResponse$inboundSchema = union([
  ChatResponse$inboundSchema,
  custom((x) => x instanceof ReadableStream).transform((stream) => {
    return new EventStream(stream, (rawEvent) => {
      var _a2;
      if (rawEvent.data === "[DONE]")
        return { done: true };
      return {
        value: (_a2 = ChatStreamingResponseChunk$inboundSchema.parse(rawEvent)) == null ? void 0 : _a2.data
      };
    });
  })
]);

// node_modules/@openrouter/sdk/esm/models/operations/updatekeys.js
var UpdateKeysLimitReset = {
  Daily: "daily",
  Weekly: "weekly",
  Monthly: "monthly"
};
var UpdateKeysLimitReset$outboundSchema = union([
  _enum(UpdateKeysLimitReset),
  string2().and(custom())
]);
var UpdateKeysRequestBody$outboundSchema = object({
  name: string2().optional(),
  disabled: boolean2().optional(),
  limit: nullable(number2()).optional(),
  limitReset: nullable(UpdateKeysLimitReset$outboundSchema).optional(),
  includeByokInLimit: boolean2().optional()
}).transform((v) => {
  return remap(v, {
    limitReset: "limit_reset",
    includeByokInLimit: "include_byok_in_limit"
  });
});
var UpdateKeysRequest$outboundSchema = object({
  hash: string2(),
  requestBody: lazy(() => UpdateKeysRequestBody$outboundSchema)
}).transform((v) => {
  return remap(v, {
    requestBody: "RequestBody"
  });
});
var UpdateKeysData$inboundSchema = object({
  hash: string2(),
  name: string2(),
  label: string2(),
  disabled: boolean2(),
  limit: nullable(number2()),
  limit_remaining: nullable(number2()),
  limit_reset: nullable(string2()),
  include_byok_in_limit: boolean2(),
  usage: number2(),
  usage_daily: number2(),
  usage_weekly: number2(),
  usage_monthly: number2(),
  byok_usage: number2(),
  byok_usage_daily: number2(),
  byok_usage_weekly: number2(),
  byok_usage_monthly: number2(),
  created_at: string2(),
  updated_at: nullable(string2()),
  expires_at: nullable(string2().datetime({ offset: true }).transform((v) => new Date(v))).optional()
}).transform((v) => {
  return remap(v, {
    "limit_remaining": "limitRemaining",
    "limit_reset": "limitReset",
    "include_byok_in_limit": "includeByokInLimit",
    "usage_daily": "usageDaily",
    "usage_weekly": "usageWeekly",
    "usage_monthly": "usageMonthly",
    "byok_usage": "byokUsage",
    "byok_usage_daily": "byokUsageDaily",
    "byok_usage_weekly": "byokUsageWeekly",
    "byok_usage_monthly": "byokUsageMonthly",
    "created_at": "createdAt",
    "updated_at": "updatedAt",
    "expires_at": "expiresAt"
  });
});
var UpdateKeysResponse$inboundSchema = object({
  data: lazy(() => UpdateKeysData$inboundSchema)
});

// node_modules/@openrouter/sdk/esm/types/async.js
var __classPrivateFieldSet2 = function(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet2 = function(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _APIPromise_promise;
var _APIPromise_unwrapped;
var _a;
var APIPromise = class {
  constructor(p) {
    _APIPromise_promise.set(this, void 0);
    _APIPromise_unwrapped.set(this, void 0);
    this[_a] = "APIPromise";
    __classPrivateFieldSet2(this, _APIPromise_promise, p instanceof Promise ? p : Promise.resolve(p), "f");
    __classPrivateFieldSet2(this, _APIPromise_unwrapped, p instanceof Promise ? __classPrivateFieldGet2(this, _APIPromise_promise, "f").then(([value]) => value) : Promise.resolve(p[0]), "f");
  }
  then(onfulfilled, onrejected) {
    return __classPrivateFieldGet2(this, _APIPromise_promise, "f").then(onfulfilled ? ([value]) => onfulfilled(value) : void 0, onrejected);
  }
  catch(onrejected) {
    return __classPrivateFieldGet2(this, _APIPromise_unwrapped, "f").catch(onrejected);
  }
  finally(onfinally) {
    return __classPrivateFieldGet2(this, _APIPromise_unwrapped, "f").finally(onfinally);
  }
  $inspect() {
    return __classPrivateFieldGet2(this, _APIPromise_promise, "f");
  }
};
_APIPromise_promise = /* @__PURE__ */ new WeakMap(), _APIPromise_unwrapped = /* @__PURE__ */ new WeakMap(), _a = Symbol.toStringTag;

// node_modules/@openrouter/sdk/esm/funcs/analyticsGetUserActivity.js
function analyticsGetUserActivity(client, request, options) {
  return new APIPromise($do(client, request, options));
}
async function $do(client, request, options) {
  const parsed = safeParse3(request, (value) => GetUserActivityRequest$outboundSchema.optional().parse(value), "Input validation failed");
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = null;
  const path = pathToFunc("/activity")();
  const query = encodeFormQuery({
    "date": payload == null ? void 0 : payload.date
  });
  const headers = new Headers(compactMap({
    Accept: "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "getUserActivity",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "GET",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    query,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["400", "401", "403", "4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, GetUserActivityResponse$inboundSchema), jsonErr(400, BadRequestResponseError$inboundSchema), jsonErr(401, UnauthorizedResponseError$inboundSchema), jsonErr(403, ForbiddenResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/sdk/analytics.js
var Analytics = class extends ClientSDK {
  /**
   * Get user activity grouped by endpoint
   *
   * @remarks
   * Returns user activity data grouped by endpoint for the last 30 (completed) UTC days
   */
  async getUserActivity(request, options) {
    return unwrapAsync(analyticsGetUserActivity(this, request, options));
  }
};

// node_modules/@openrouter/sdk/esm/funcs/apiKeysCreate.js
function apiKeysCreate(client, request, options) {
  return new APIPromise($do2(client, request, options));
}
async function $do2(client, request, options) {
  const parsed = safeParse3(request, (value) => CreateKeysRequest$outboundSchema.parse(value), "Input validation failed");
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/keys")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "createKeys",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["400", "401", "429", "4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(201, CreateKeysResponse$inboundSchema), jsonErr(400, BadRequestResponseError$inboundSchema), jsonErr(401, UnauthorizedResponseError$inboundSchema), jsonErr(429, TooManyRequestsResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/funcs/apiKeysDelete.js
function apiKeysDelete(client, request, options) {
  return new APIPromise($do3(client, request, options));
}
async function $do3(client, request, options) {
  const parsed = safeParse3(request, (value) => DeleteKeysRequest$outboundSchema.parse(value), "Input validation failed");
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = null;
  const pathParams = {
    hash: encodeSimple("hash", payload.hash, {
      explode: false,
      charEncoding: "percent"
    })
  };
  const path = pathToFunc("/keys/{hash}")(pathParams);
  const headers = new Headers(compactMap({
    Accept: "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "deleteKeys",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "DELETE",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["401", "404", "429", "4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, DeleteKeysResponse$inboundSchema), jsonErr(401, UnauthorizedResponseError$inboundSchema), jsonErr(404, NotFoundResponseError$inboundSchema), jsonErr(429, TooManyRequestsResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/funcs/apiKeysGet.js
function apiKeysGet(client, request, options) {
  return new APIPromise($do4(client, request, options));
}
async function $do4(client, request, options) {
  const parsed = safeParse3(request, (value) => GetKeyRequest$outboundSchema.parse(value), "Input validation failed");
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = null;
  const pathParams = {
    hash: encodeSimple("hash", payload.hash, {
      explode: false,
      charEncoding: "percent"
    })
  };
  const path = pathToFunc("/keys/{hash}")(pathParams);
  const headers = new Headers(compactMap({
    Accept: "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "getKey",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "GET",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["401", "404", "429", "4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, GetKeyResponse$inboundSchema), jsonErr(401, UnauthorizedResponseError$inboundSchema), jsonErr(404, NotFoundResponseError$inboundSchema), jsonErr(429, TooManyRequestsResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/funcs/apiKeysGetCurrentKeyMetadata.js
function apiKeysGetCurrentKeyMetadata(client, options) {
  return new APIPromise($do5(client, options));
}
async function $do5(client, options) {
  const path = pathToFunc("/key")();
  const headers = new Headers(compactMap({
    Accept: "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "getCurrentKey",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "GET",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["401", "4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, GetCurrentKeyResponse$inboundSchema), jsonErr(401, UnauthorizedResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/funcs/apiKeysList.js
function apiKeysList(client, request, options) {
  return new APIPromise($do6(client, request, options));
}
async function $do6(client, request, options) {
  const parsed = safeParse3(request, (value) => ListRequest$outboundSchema.optional().parse(value), "Input validation failed");
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = null;
  const path = pathToFunc("/keys")();
  const query = encodeFormQuery({
    "include_disabled": payload == null ? void 0 : payload.include_disabled,
    "offset": payload == null ? void 0 : payload.offset
  });
  const headers = new Headers(compactMap({
    Accept: "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "list",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "GET",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    query,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["401", "429", "4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, ListResponse$inboundSchema), jsonErr(401, UnauthorizedResponseError$inboundSchema), jsonErr(429, TooManyRequestsResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/funcs/apiKeysUpdate.js
function apiKeysUpdate(client, request, options) {
  return new APIPromise($do7(client, request, options));
}
async function $do7(client, request, options) {
  const parsed = safeParse3(request, (value) => UpdateKeysRequest$outboundSchema.parse(value), "Input validation failed");
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload.RequestBody, { explode: true });
  const pathParams = {
    hash: encodeSimple("hash", payload.hash, {
      explode: false,
      charEncoding: "percent"
    })
  };
  const path = pathToFunc("/keys/{hash}")(pathParams);
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "updateKeys",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "PATCH",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["400", "401", "404", "429", "4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, UpdateKeysResponse$inboundSchema), jsonErr(400, BadRequestResponseError$inboundSchema), jsonErr(401, UnauthorizedResponseError$inboundSchema), jsonErr(404, NotFoundResponseError$inboundSchema), jsonErr(429, TooManyRequestsResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/sdk/apikeys.js
var APIKeys = class extends ClientSDK {
  /**
   * List API keys
   */
  async list(request, options) {
    return unwrapAsync(apiKeysList(this, request, options));
  }
  /**
   * Create a new API key
   */
  async create(request, options) {
    return unwrapAsync(apiKeysCreate(this, request, options));
  }
  /**
   * Update an API key
   */
  async update(request, options) {
    return unwrapAsync(apiKeysUpdate(this, request, options));
  }
  /**
   * Delete an API key
   */
  async delete(request, options) {
    return unwrapAsync(apiKeysDelete(this, request, options));
  }
  /**
   * Get a single API key
   */
  async get(request, options) {
    return unwrapAsync(apiKeysGet(this, request, options));
  }
  /**
   * Get current API key
   *
   * @remarks
   * Get information on the API key associated with the current authentication session
   */
  async getCurrentKeyMetadata(options) {
    return unwrapAsync(apiKeysGetCurrentKeyMetadata(this, options));
  }
};

// node_modules/@openrouter/sdk/esm/funcs/betaResponsesSend.js
function betaResponsesSend(client, request, options) {
  return new APIPromise($do8(client, request, options));
}
async function $do8(client, request, options) {
  const parsed = safeParse3(request, (value) => OpenResponsesRequest$outboundSchema.parse(value), "Input validation failed");
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/responses")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: (request == null ? void 0 : request.stream) ? "text/event-stream" : "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "createResponses",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: [
      "400",
      "401",
      "402",
      "404",
      "408",
      "413",
      "422",
      "429",
      "4XX",
      "500",
      "502",
      "503",
      "524",
      "529",
      "5XX"
    ],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, CreateResponsesResponse$inboundSchema), sse(200, CreateResponsesResponse$inboundSchema), jsonErr(400, BadRequestResponseError$inboundSchema), jsonErr(401, UnauthorizedResponseError$inboundSchema), jsonErr(402, PaymentRequiredResponseError$inboundSchema), jsonErr(404, NotFoundResponseError$inboundSchema), jsonErr(408, RequestTimeoutResponseError$inboundSchema), jsonErr(413, PayloadTooLargeResponseError$inboundSchema), jsonErr(422, UnprocessableEntityResponseError$inboundSchema), jsonErr(429, TooManyRequestsResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), jsonErr(502, BadGatewayResponseError$inboundSchema), jsonErr(503, ServiceUnavailableResponseError$inboundSchema), jsonErr(524, EdgeNetworkTimeoutResponseError$inboundSchema), jsonErr(529, ProviderOverloadedResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/sdk/responses.js
var Responses = class extends ClientSDK {
  async send(request, options) {
    return unwrapAsync(betaResponsesSend(this, request, options));
  }
};

// node_modules/@openrouter/sdk/esm/sdk/beta.js
var Beta = class extends ClientSDK {
  get responses() {
    return this._responses ?? (this._responses = new Responses(this._options));
  }
};

// node_modules/@openrouter/sdk/esm/funcs/chatSend.js
function chatSend(client, request, options) {
  return new APIPromise($do9(client, request, options));
}
async function $do9(client, request, options) {
  const parsed = safeParse3(request, (value) => ChatGenerationParams$outboundSchema.parse(value), "Input validation failed");
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/chat/completions")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: (request == null ? void 0 : request.stream) ? "text/event-stream" : "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "sendChatCompletionRequest",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["400", "401", "429", "4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, SendChatCompletionRequestResponse$inboundSchema), sse(200, SendChatCompletionRequestResponse$inboundSchema), jsonErr([400, 401, 429], ChatError$inboundSchema), jsonErr(500, ChatError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/sdk/chat.js
var Chat = class extends ClientSDK {
  async send(request, options) {
    return unwrapAsync(chatSend(this, request, options));
  }
};

// node_modules/@openrouter/sdk/esm/funcs/completionsGenerate.js
function completionsGenerate(client, request, options) {
  return new APIPromise($do10(client, request, options));
}
async function $do10(client, request, options) {
  const parsed = safeParse3(request, (value) => CompletionCreateParams$outboundSchema.parse(value), "Input validation failed");
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/completions")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "createCompletions",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["400", "401", "429", "4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, CompletionResponse$inboundSchema), jsonErr([400, 401, 429], ChatError$inboundSchema), jsonErr(500, ChatError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/sdk/completions.js
var Completions = class extends ClientSDK {
  /**
   * Create a completion
   *
   * @remarks
   * Creates a completion for the provided prompt and parameters. Supports both streaming and non-streaming modes.
   */
  async generate(request, options) {
    return unwrapAsync(completionsGenerate(this, request, options));
  }
};

// node_modules/@openrouter/sdk/esm/funcs/creditsCreateCoinbaseCharge.js
function creditsCreateCoinbaseCharge(client, security, request, options) {
  return new APIPromise($do11(client, security, request, options));
}
async function $do11(client, security, request, options) {
  const parsed = safeParse3(request, (value) => CreateChargeRequest$outboundSchema.parse(value), "Input validation failed");
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/credits/coinbase")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json"
  }));
  const requestSecurity = resolveSecurity([
    {
      fieldName: "Authorization",
      type: "http:bearer",
      value: security == null ? void 0 : security.bearer
    }
  ]);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "createCoinbaseCharge",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: security,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["400", "401", "429", "4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, CreateCoinbaseChargeResponse$inboundSchema), jsonErr(400, BadRequestResponseError$inboundSchema), jsonErr(401, UnauthorizedResponseError$inboundSchema), jsonErr(429, TooManyRequestsResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/funcs/creditsGetCredits.js
function creditsGetCredits(client, options) {
  return new APIPromise($do12(client, options));
}
async function $do12(client, options) {
  const path = pathToFunc("/credits")();
  const headers = new Headers(compactMap({
    Accept: "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "getCredits",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "GET",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["401", "403", "4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, GetCreditsResponse$inboundSchema), jsonErr(401, UnauthorizedResponseError$inboundSchema), jsonErr(403, ForbiddenResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/sdk/credits.js
var Credits = class extends ClientSDK {
  /**
   * Get remaining credits
   *
   * @remarks
   * Get total credits purchased and used for the authenticated user
   */
  async getCredits(options) {
    return unwrapAsync(creditsGetCredits(this, options));
  }
  /**
   * Create a Coinbase charge for crypto payment
   *
   * @remarks
   * Create a Coinbase charge for crypto payment
   */
  async createCoinbaseCharge(security, request, options) {
    return unwrapAsync(creditsCreateCoinbaseCharge(this, security, request, options));
  }
};

// node_modules/@openrouter/sdk/esm/funcs/embeddingsGenerate.js
function embeddingsGenerate(client, request, options) {
  return new APIPromise($do13(client, request, options));
}
async function $do13(client, request, options) {
  const parsed = safeParse3(request, (value) => CreateEmbeddingsRequest$outboundSchema.parse(value), "Input validation failed");
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/embeddings")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json;q=1, text/event-stream;q=0"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "createEmbeddings",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: [
      "400",
      "401",
      "402",
      "404",
      "429",
      "4XX",
      "500",
      "502",
      "503",
      "524",
      "529",
      "5XX"
    ],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, CreateEmbeddingsResponse$inboundSchema), text(200, CreateEmbeddingsResponse$inboundSchema, {
    ctype: "text/event-stream"
  }), jsonErr(400, BadRequestResponseError$inboundSchema), jsonErr(401, UnauthorizedResponseError$inboundSchema), jsonErr(402, PaymentRequiredResponseError$inboundSchema), jsonErr(404, NotFoundResponseError$inboundSchema), jsonErr(429, TooManyRequestsResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), jsonErr(502, BadGatewayResponseError$inboundSchema), jsonErr(503, ServiceUnavailableResponseError$inboundSchema), jsonErr(524, EdgeNetworkTimeoutResponseError$inboundSchema), jsonErr(529, ProviderOverloadedResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/funcs/embeddingsListModels.js
function embeddingsListModels(client, options) {
  return new APIPromise($do14(client, options));
}
async function $do14(client, options) {
  const path = pathToFunc("/embeddings/models")();
  const headers = new Headers(compactMap({
    Accept: "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "listEmbeddingsModels",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "GET",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["400", "4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, ModelsListResponse$inboundSchema), jsonErr(400, BadRequestResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/sdk/embeddings.js
var Embeddings = class extends ClientSDK {
  /**
   * Submit an embedding request
   *
   * @remarks
   * Submits an embedding request to the embeddings router
   */
  async generate(request, options) {
    return unwrapAsync(embeddingsGenerate(this, request, options));
  }
  /**
   * List all embeddings models
   *
   * @remarks
   * Returns a list of all available embeddings models and their properties
   */
  async listModels(options) {
    return unwrapAsync(embeddingsListModels(this, options));
  }
};

// node_modules/@openrouter/sdk/esm/funcs/endpointsList.js
function endpointsList(client, request, options) {
  return new APIPromise($do15(client, request, options));
}
async function $do15(client, request, options) {
  const parsed = safeParse3(request, (value) => ListEndpointsRequest$outboundSchema.parse(value), "Input validation failed");
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = null;
  const pathParams = {
    author: encodeSimple("author", payload.author, {
      explode: false,
      charEncoding: "percent"
    }),
    slug: encodeSimple("slug", payload.slug, {
      explode: false,
      charEncoding: "percent"
    })
  };
  const path = pathToFunc("/models/{author}/{slug}/endpoints")(pathParams);
  const headers = new Headers(compactMap({
    Accept: "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "listEndpoints",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "GET",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["404", "4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, ListEndpointsResponse$inboundSchema2), jsonErr(404, NotFoundResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/funcs/endpointsListZdrEndpoints.js
function endpointsListZdrEndpoints(client, options) {
  return new APIPromise($do16(client, options));
}
async function $do16(client, options) {
  const path = pathToFunc("/endpoints/zdr")();
  const headers = new Headers(compactMap({
    Accept: "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "listEndpointsZdr",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "GET",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, ListEndpointsZdrResponse$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/sdk/endpoints.js
var Endpoints = class extends ClientSDK {
  /**
   * List all endpoints for a model
   */
  async list(request, options) {
    return unwrapAsync(endpointsList(this, request, options));
  }
  /**
   * Preview the impact of ZDR on the available endpoints
   */
  async listZdrEndpoints(options) {
    return unwrapAsync(endpointsListZdrEndpoints(this, options));
  }
};

// node_modules/@openrouter/sdk/esm/funcs/generationsGetGeneration.js
function generationsGetGeneration(client, request, options) {
  return new APIPromise($do17(client, request, options));
}
async function $do17(client, request, options) {
  const parsed = safeParse3(request, (value) => GetGenerationRequest$outboundSchema.parse(value), "Input validation failed");
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = null;
  const path = pathToFunc("/generation")();
  const query = encodeFormQuery({
    "id": payload.id
  });
  const headers = new Headers(compactMap({
    Accept: "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "getGeneration",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "GET",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    query,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: [
      "401",
      "402",
      "404",
      "429",
      "4XX",
      "500",
      "502",
      "524",
      "529",
      "5XX"
    ],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, GetGenerationResponse$inboundSchema), jsonErr(401, UnauthorizedResponseError$inboundSchema), jsonErr(402, PaymentRequiredResponseError$inboundSchema), jsonErr(404, NotFoundResponseError$inboundSchema), jsonErr(429, TooManyRequestsResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), jsonErr(502, BadGatewayResponseError$inboundSchema), jsonErr(524, EdgeNetworkTimeoutResponseError$inboundSchema), jsonErr(529, ProviderOverloadedResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/sdk/generations.js
var Generations = class extends ClientSDK {
  /**
   * Get request & usage metadata for a generation
   */
  async getGeneration(request, options) {
    return unwrapAsync(generationsGetGeneration(this, request, options));
  }
};

// node_modules/@openrouter/sdk/esm/funcs/modelsCount.js
function modelsCount(client, options) {
  return new APIPromise($do18(client, options));
}
async function $do18(client, options) {
  const path = pathToFunc("/models/count")();
  const headers = new Headers(compactMap({
    Accept: "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "listModelsCount",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "GET",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, ModelsCountResponse$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/funcs/modelsList.js
function modelsList(client, request, options) {
  return new APIPromise($do19(client, request, options));
}
async function $do19(client, request, options) {
  const parsed = safeParse3(request, (value) => GetModelsRequest$outboundSchema.optional().parse(value), "Input validation failed");
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = null;
  const path = pathToFunc("/models")();
  const query = encodeFormQuery({
    "category": payload == null ? void 0 : payload.category,
    "supported_parameters": payload == null ? void 0 : payload.supported_parameters
  });
  const headers = new Headers(compactMap({
    Accept: "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "getModels",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "GET",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    query,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["400", "4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, ModelsListResponse$inboundSchema), jsonErr(400, BadRequestResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/funcs/modelsListForUser.js
function modelsListForUser(client, security, options) {
  return new APIPromise($do20(client, security, options));
}
async function $do20(client, security, options) {
  const path = pathToFunc("/models/user")();
  const headers = new Headers(compactMap({
    Accept: "application/json"
  }));
  const requestSecurity = resolveSecurity([
    {
      fieldName: "Authorization",
      type: "http:bearer",
      value: security == null ? void 0 : security.bearer
    }
  ]);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "listModelsUser",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: security,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "GET",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["401", "4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, ModelsListResponse$inboundSchema), jsonErr(401, UnauthorizedResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/sdk/models.js
var Models = class extends ClientSDK {
  /**
   * Get total count of available models
   */
  async count(options) {
    return unwrapAsync(modelsCount(this, options));
  }
  /**
   * List all models and their properties
   */
  async list(request, options) {
    return unwrapAsync(modelsList(this, request, options));
  }
  /**
   * List models filtered by user provider preferences
   */
  async listForUser(security, options) {
    return unwrapAsync(modelsListForUser(this, security, options));
  }
};

// node_modules/@openrouter/sdk/esm/funcs/oAuthCreateAuthCode.js
function oAuthCreateAuthCode(client, request, options) {
  return new APIPromise($do21(client, request, options));
}
async function $do21(client, request, options) {
  const parsed = safeParse3(request, (value) => CreateAuthKeysCodeRequest$outboundSchema.parse(value), "Input validation failed");
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/auth/keys/code")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "createAuthKeysCode",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["400", "401", "4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, CreateAuthKeysCodeResponse$inboundSchema), jsonErr(400, BadRequestResponseError$inboundSchema), jsonErr(401, UnauthorizedResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/funcs/oAuthExchangeAuthCodeForAPIKey.js
function oAuthExchangeAuthCodeForAPIKey(client, request, options) {
  return new APIPromise($do22(client, request, options));
}
async function $do22(client, request, options) {
  const parsed = safeParse3(request, (value) => ExchangeAuthCodeForAPIKeyRequest$outboundSchema.parse(value), "Input validation failed");
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/auth/keys")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "exchangeAuthCodeForAPIKey",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["400", "403", "4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, ExchangeAuthCodeForAPIKeyResponse$inboundSchema), jsonErr(400, BadRequestResponseError$inboundSchema), jsonErr(403, ForbiddenResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/zod/v3/external.js
var external_exports2 = {};
__export(external_exports2, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER2,
  OK: () => OK2,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType2,
  ZodAny: () => ZodAny2,
  ZodArray: () => ZodArray2,
  ZodBigInt: () => ZodBigInt2,
  ZodBoolean: () => ZodBoolean2,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch2,
  ZodDate: () => ZodDate2,
  ZodDefault: () => ZodDefault2,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum2,
  ZodError: () => ZodError2,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind2,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection2,
  ZodIssueCode: () => ZodIssueCode2,
  ZodLazy: () => ZodLazy2,
  ZodLiteral: () => ZodLiteral2,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever2,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable2,
  ZodNumber: () => ZodNumber2,
  ZodObject: () => ZodObject2,
  ZodOptional: () => ZodOptional2,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly2,
  ZodRecord: () => ZodRecord2,
  ZodSchema: () => ZodType2,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString2,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType2,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion2,
  ZodUnknown: () => ZodUnknown2,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom2,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default2,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType2,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs2(_arg) {
  }
  util2.assertIs = assertIs2;
  function assertNever2(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever2;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object2) => {
    const keys = [];
    for (const key in object2) {
      if (Object.prototype.hasOwnProperty.call(object2, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues2(array2, separator = " | ") {
    return array2.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues2;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType2 = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode2 = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json2 = JSON.stringify(obj, null, 2);
  return json2.replace(/"([^"]+)":/g, "$1:");
};
var ZodError2 = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue2) {
      return issue2.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error2) => {
      for (const issue2 of error2.issues) {
        if (issue2.code === "invalid_union") {
          issue2.unionErrors.map(processError);
        } else if (issue2.code === "invalid_return_type") {
          processError(issue2.returnTypeError);
        } else if (issue2.code === "invalid_arguments") {
          processError(issue2.argumentsError);
        } else if (issue2.path.length === 0) {
          fieldErrors._errors.push(mapper(issue2));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue2.path.length) {
            const el = issue2.path[i];
            const terminal = i === issue2.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue2));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue2) => issue2.message) {
    const fieldErrors = /* @__PURE__ */ Object.create(null);
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError2.create = (issues) => {
  const error2 = new ZodError2(issues);
  return error2;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue2, _ctx) => {
  let message;
  switch (issue2.code) {
    case ZodIssueCode2.invalid_type:
      if (issue2.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue2.expected}, received ${issue2.received}`;
      }
      break;
    case ZodIssueCode2.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue2.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode2.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue2.keys, ", ")}`;
      break;
    case ZodIssueCode2.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode2.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue2.options)}`;
      break;
    case ZodIssueCode2.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue2.options)}, received '${issue2.received}'`;
      break;
    case ZodIssueCode2.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode2.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode2.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode2.invalid_string:
      if (typeof issue2.validation === "object") {
        if ("includes" in issue2.validation) {
          message = `Invalid input: must include "${issue2.validation.includes}"`;
          if (typeof issue2.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue2.validation.position}`;
          }
        } else if ("startsWith" in issue2.validation) {
          message = `Invalid input: must start with "${issue2.validation.startsWith}"`;
        } else if ("endsWith" in issue2.validation) {
          message = `Invalid input: must end with "${issue2.validation.endsWith}"`;
        } else {
          util.assertNever(issue2.validation);
        }
      } else if (issue2.validation !== "regex") {
        message = `Invalid ${issue2.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode2.too_small:
      if (issue2.type === "array")
        message = `Array must contain ${issue2.exact ? "exactly" : issue2.inclusive ? `at least` : `more than`} ${issue2.minimum} element(s)`;
      else if (issue2.type === "string")
        message = `String must contain ${issue2.exact ? "exactly" : issue2.inclusive ? `at least` : `over`} ${issue2.minimum} character(s)`;
      else if (issue2.type === "number")
        message = `Number must be ${issue2.exact ? `exactly equal to ` : issue2.inclusive ? `greater than or equal to ` : `greater than `}${issue2.minimum}`;
      else if (issue2.type === "bigint")
        message = `Number must be ${issue2.exact ? `exactly equal to ` : issue2.inclusive ? `greater than or equal to ` : `greater than `}${issue2.minimum}`;
      else if (issue2.type === "date")
        message = `Date must be ${issue2.exact ? `exactly equal to ` : issue2.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue2.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode2.too_big:
      if (issue2.type === "array")
        message = `Array must contain ${issue2.exact ? `exactly` : issue2.inclusive ? `at most` : `less than`} ${issue2.maximum} element(s)`;
      else if (issue2.type === "string")
        message = `String must contain ${issue2.exact ? `exactly` : issue2.inclusive ? `at most` : `under`} ${issue2.maximum} character(s)`;
      else if (issue2.type === "number")
        message = `Number must be ${issue2.exact ? `exactly` : issue2.inclusive ? `less than or equal to` : `less than`} ${issue2.maximum}`;
      else if (issue2.type === "bigint")
        message = `BigInt must be ${issue2.exact ? `exactly` : issue2.inclusive ? `less than or equal to` : `less than`} ${issue2.maximum}`;
      else if (issue2.type === "date")
        message = `Date must be ${issue2.exact ? `exactly` : issue2.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue2.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode2.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode2.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode2.not_multiple_of:
      message = `Number must be a multiple of ${issue2.multipleOf}`;
      break;
    case ZodIssueCode2.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue2);
  }
  return { message };
};
var en_default2 = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default2;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue2 = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default2 ? void 0 : en_default2
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue2);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK2 = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message == null ? void 0 : message.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error2 = new ZodError2(ctx.common.issues);
        this._error = error2;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType2 = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType2(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType2(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType2(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: (params == null ? void 0 : params.async) ?? false,
        contextualErrorMap: params == null ? void 0 : params.errorMap
      },
      path: (params == null ? void 0 : params.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType2(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    var _a2, _b;
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType2(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if ((_b = (_a2 = err == null ? void 0 : err.message) == null ? void 0 : _a2.toLowerCase()) == null ? void 0 : _b.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params == null ? void 0 : params.errorMap,
        async: true
      },
      path: (params == null ? void 0 : params.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType2(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode2.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind2.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional2.create(this, this._def);
  }
  nullable() {
    return ZodNullable2.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray2.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion2.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection2.create(this, incoming, this._def);
  }
  transform(transform2) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind2.ZodEffects,
      effect: { type: "transform", transform: transform2 }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault2({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind2.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind2.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch2({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind2.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly2.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version2) {
  if ((version2 === "v4" || !version2) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version2 === "v6" || !version2) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT2(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base642 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base642));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && (decoded == null ? void 0 : decoded.typ) !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version2) {
  if ((version2 === "v4" || !version2) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version2 === "v6" || !version2) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString2 = class _ZodString2 extends ZodType2 {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode2.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode2.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode2.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode2.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode2.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode2.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode2.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode2.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode2.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode2.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode2.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode2.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode2.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT2(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode2.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode2.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode2.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode2.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode2.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString2({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof (options == null ? void 0 : options.precision) === "undefined" ? null : options == null ? void 0 : options.precision,
      offset: (options == null ? void 0 : options.offset) ?? false,
      local: (options == null ? void 0 : options.local) ?? false,
      ...errorUtil.errToObj(options == null ? void 0 : options.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof (options == null ? void 0 : options.precision) === "undefined" ? null : options == null ? void 0 : options.precision,
      ...errorUtil.errToObj(options == null ? void 0 : options.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options == null ? void 0 : options.position,
      ...errorUtil.errToObj(options == null ? void 0 : options.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString2({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString2({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString2({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString2.create = (params) => {
  return new ZodString2({
    checks: [],
    typeName: ZodFirstPartyTypeKind2.ZodString,
    coerce: (params == null ? void 0 : params.coerce) ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder2(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber2 = class _ZodNumber extends ZodType2 {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder2(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber2.create = (params) => {
  return new ZodNumber2({
    checks: [],
    typeName: ZodFirstPartyTypeKind2.ZodNumber,
    coerce: (params == null ? void 0 : params.coerce) || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt2 = class _ZodBigInt extends ZodType2 {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode2.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt2.create = (params) => {
  return new ZodBigInt2({
    checks: [],
    typeName: ZodFirstPartyTypeKind2.ZodBigInt,
    coerce: (params == null ? void 0 : params.coerce) ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean2 = class extends ZodType2 {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK2(input.data);
  }
};
ZodBoolean2.create = (params) => {
  return new ZodBoolean2({
    typeName: ZodFirstPartyTypeKind2.ZodBoolean,
    coerce: (params == null ? void 0 : params.coerce) || false,
    ...processCreateParams(params)
  });
};
var ZodDate2 = class _ZodDate extends ZodType2 {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode2.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate2.create = (params) => {
  return new ZodDate2({
    checks: [],
    coerce: (params == null ? void 0 : params.coerce) || false,
    typeName: ZodFirstPartyTypeKind2.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType2 {
  _parse(input) {
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK2(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind2.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType2 {
  _parse(input) {
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK2(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind2.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType2 {
  _parse(input) {
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK2(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind2.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny2 = class extends ZodType2 {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK2(input.data);
  }
};
ZodAny2.create = (params) => {
  return new ZodAny2({
    typeName: ZodFirstPartyTypeKind2.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown2 = class extends ZodType2 {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK2(input.data);
  }
};
ZodUnknown2.create = (params) => {
  return new ZodUnknown2({
    typeName: ZodFirstPartyTypeKind2.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever2 = class extends ZodType2 {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode2.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever2.create = (params) => {
  return new ZodNever2({
    typeName: ZodFirstPartyTypeKind2.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType2 {
  _parse(input) {
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK2(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind2.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray2 = class _ZodArray extends ZodType2 {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode2.too_big : ZodIssueCode2.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode2.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode2.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray2.create = (schema, params) => {
  return new ZodArray2({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind2.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject2) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional2.create(deepPartialify(fieldSchema));
    }
    return new ZodObject2({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray2) {
    return new ZodArray2({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional2) {
    return ZodOptional2.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable2) {
    return ZodNullable2.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject2 = class _ZodObject extends ZodType2 {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever2 && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever2) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode2.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue2, ctx) => {
          var _a2, _b;
          const defaultError = ((_b = (_a2 = this._def).errorMap) == null ? void 0 : _b.call(_a2, issue2, ctx).message) ?? ctx.defaultError;
          if (issue2.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind2.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional2) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject2.create = (shape, params) => {
  return new ZodObject2({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever2.create(),
    typeName: ZodFirstPartyTypeKind2.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject2.strictCreate = (shape, params) => {
  return new ZodObject2({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever2.create(),
    typeName: ZodFirstPartyTypeKind2.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject2.lazycreate = (shape, params) => {
  return new ZodObject2({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever2.create(),
    typeName: ZodFirstPartyTypeKind2.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion2 = class extends ZodType2 {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError2(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError2(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion2.create = (types, params) => {
  return new ZodUnion2({
    options: types,
    typeName: ZodFirstPartyTypeKind2.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy2) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral2) {
    return [type.value];
  } else if (type instanceof ZodEnum2) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault2) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional2) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable2) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly2) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch2) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType2 {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind2.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues2(a, b) {
  const aType = getParsedType2(a);
  const bType = getParsedType2(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues2(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues2(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection2 = class extends ZodType2 {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues2(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode2.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection2.create = (left, right, params) => {
  return new ZodIntersection2({
    left,
    right,
    typeName: ZodFirstPartyTypeKind2.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType2 {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind2.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord2 = class _ZodRecord extends ZodType2 {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType2) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind2.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString2.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind2.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType2 {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind2.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType2 {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode2.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode2.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind2.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType2 {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error2) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default2].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode2.invalid_arguments,
          argumentsError: error2
        }
      });
    }
    function makeReturnsIssue(returns, error2) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default2].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode2.invalid_return_type,
          returnTypeError: error2
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK2(async function(...args) {
        const error2 = new ZodError2([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error2.addIssue(makeArgsIssue(args, e));
          throw error2;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error2.addIssue(makeReturnsIssue(result, e));
          throw error2;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK2(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError2([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError2([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown2.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown2.create()),
      returns: returns || ZodUnknown2.create(),
      typeName: ZodFirstPartyTypeKind2.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy2 = class extends ZodType2 {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy2.create = (getter, params) => {
  return new ZodLazy2({
    getter,
    typeName: ZodFirstPartyTypeKind2.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral2 = class extends ZodType2 {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode2.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral2.create = (value, params) => {
  return new ZodLiteral2({
    value,
    typeName: ZodFirstPartyTypeKind2.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum2({
    values,
    typeName: ZodFirstPartyTypeKind2.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum2 = class _ZodEnum extends ZodType2 {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode2.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode2.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK2(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum2.create = createZodEnum;
var ZodNativeEnum = class extends ZodType2 {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode2.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode2.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK2(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind2.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType2 {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK2(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind2.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType2 {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind2.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind2.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind2.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional2 = class extends ZodType2 {
  _parse(input) {
    const parsedType2 = this._getType(input);
    if (parsedType2 === ZodParsedType.undefined) {
      return OK2(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional2.create = (type, params) => {
  return new ZodOptional2({
    innerType: type,
    typeName: ZodFirstPartyTypeKind2.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable2 = class extends ZodType2 {
  _parse(input) {
    const parsedType2 = this._getType(input);
    if (parsedType2 === ZodParsedType.null) {
      return OK2(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable2.create = (type, params) => {
  return new ZodNullable2({
    innerType: type,
    typeName: ZodFirstPartyTypeKind2.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault2 = class extends ZodType2 {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault2.create = (type, params) => {
  return new ZodDefault2({
    innerType: type,
    typeName: ZodFirstPartyTypeKind2.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch2 = class extends ZodType2 {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError2(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError2(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch2.create = (type, params) => {
  return new ZodCatch2({
    innerType: type,
    typeName: ZodFirstPartyTypeKind2.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType2 {
  _parse(input) {
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind2.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType2 {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType2 {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind2.ZodPipeline
    });
  }
};
var ZodReadonly2 = class extends ZodType2 {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly2.create = (type, params) => {
  return new ZodReadonly2({
    innerType: type,
    typeName: ZodFirstPartyTypeKind2.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom2(check, _params = {}, fatal) {
  if (check)
    return ZodAny2.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny2.create();
}
var late = {
  object: ZodObject2.lazycreate
};
var ZodFirstPartyTypeKind2;
(function(ZodFirstPartyTypeKind3) {
  ZodFirstPartyTypeKind3["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind3["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind3["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind3["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind3["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind3["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind3["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind3["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind3["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind3["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind3["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind3["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind3["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind3["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind3["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind3["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind3["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind3["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind3["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind3["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind3["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind3["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind3["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind3["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind3["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind3["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind3["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind3["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind3["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind3["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind3["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind3["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind3["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind3["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind3["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind3["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind2 || (ZodFirstPartyTypeKind2 = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom2((data) => data instanceof cls, params);
var stringType = ZodString2.create;
var numberType = ZodNumber2.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt2.create;
var booleanType = ZodBoolean2.create;
var dateType = ZodDate2.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny2.create;
var unknownType = ZodUnknown2.create;
var neverType = ZodNever2.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray2.create;
var objectType = ZodObject2.create;
var strictObjectType = ZodObject2.strictCreate;
var unionType = ZodUnion2.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection2.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord2.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy2.create;
var literalType = ZodLiteral2.create;
var enumType = ZodEnum2.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional2.create;
var nullableType = ZodNullable2.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: ((arg) => ZodString2.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber2.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean2.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt2.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate2.create({ ...arg, coerce: true }))
};
var NEVER2 = INVALID;

// node_modules/zod/v3/index.js
var v3_default = external_exports2;

// node_modules/@openrouter/sdk/esm/funcs/oAuthCreateAuthorizationUrl.js
var CreateAuthorizationUrlBaseSchema = v3_default.object({
  callbackUrl: v3_default.union([v3_default.string().url(), v3_default.instanceof(URL)]),
  limit: v3_default.number().optional()
});
var CreateAuthorizationurlParamsSchema = v3_default.union([
  CreateAuthorizationUrlBaseSchema.extend({
    codeChallengeMethod: v3_default.enum(["S256", "plain"]),
    codeChallenge: v3_default.string()
  }),
  CreateAuthorizationUrlBaseSchema
]);
function oAuthCreateAuthorizationUrl(client, params) {
  const parsedParams = CreateAuthorizationurlParamsSchema.safeParse(params);
  if (!parsedParams.success)
    return { ok: false, error: parsedParams.error };
  const baseURL = serverURLFromOptions(client._options);
  if (!baseURL) {
    return { ok: false, error: new Error("No server URL configured") };
  }
  const authURL = new URL("/auth", baseURL);
  authURL.searchParams.set("callback_url", parsedParams.data.callbackUrl.toString());
  if ("codeChallengeMethod" in parsedParams.data) {
    authURL.searchParams.set("code_challenge", parsedParams.data.codeChallenge);
    authURL.searchParams.set("code_challenge_method", parsedParams.data.codeChallengeMethod);
  }
  if (parsedParams.data.limit !== void 0) {
    authURL.searchParams.set("limit", parsedParams.data.limit.toString());
  }
  return { ok: true, value: authURL.toString() };
}

// node_modules/@openrouter/sdk/esm/funcs/oAuthCreateSHA256CodeChallenge.js
var CreateSHA256CodeChallengeRequestSchema = v3_default.object({
  /**
   * If not provided, a random code verifier will be generated.
   * If provided, must be 43-128 characters and contain only unreserved
   * characters [A-Za-z0-9-._~] per RFC 7636.
   */
  codeVerifier: v3_default.string().min(43, "Code verifier must be at least 43 characters").max(128, "Code verifier must be at most 128 characters").regex(/^[A-Za-z0-9\-._~]+$/, "Code verifier must only contain unreserved characters: [A-Za-z0-9-._~]").optional()
});
function arrayBufferToBase64Url(buffer) {
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function generateCodeVerifier() {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return arrayBufferToBase64Url(randomBytes);
}
async function oAuthCreateSHA256CodeChallenge(params = {}) {
  const parsedParams = CreateSHA256CodeChallengeRequestSchema.safeParse(params);
  if (!parsedParams.success)
    return { ok: false, error: parsedParams.error };
  const { codeVerifier = generateCodeVerifier() } = parsedParams.data;
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hash);
  const codeChallenge = arrayBufferToBase64Url(hashArray);
  return {
    ok: true,
    value: {
      codeChallenge,
      codeVerifier
    }
  };
}

// node_modules/@openrouter/sdk/esm/sdk/oauth.js
var OAuth = class extends ClientSDK {
  // #region sdk-class-body
  /**
   * Generate a OAuth2 authorization URL
   *
   * @remarks
   * Generates a URL to redirect users to for authorizing your application. The
   * URL includes the provided callback URL and, if applicable, the code
   * challenge parameters for PKCE.
   *
   * @see {@link https://openrouter.ai/docs/use-cases/oauth-pkce}
   */
  async createAuthorizationUrl(request) {
    const result = oAuthCreateAuthorizationUrl(this, request);
    if (!result.ok) {
      throw result.error;
    }
    return result.value;
  }
  /**
   * Generate a SHA-256 code challenge for PKCE
   *
   * @remarks
   * Generates a SHA-256 code challenge and corresponding code verifier for use
   * in the PKCE extension to OAuth2. If no code verifier is provided, a random
   * one will be generated according to RFC 7636 (32 random bytes, base64url
   * encoded). If a code verifier is provided, it must be 43-128 characters and
   * contain only unreserved characters [A-Za-z0-9-._~].
   *
   * @see {@link https://openrouter.ai/docs/use-cases/oauth-pkce}
   * @see {@link https://datatracker.ietf.org/doc/html/rfc7636}
   */
  async createSHA256CodeChallenge() {
    return unwrapAsync(oAuthCreateSHA256CodeChallenge());
  }
  // #endregion sdk-class-body
  /**
   * Exchange authorization code for API key
   *
   * @remarks
   * Exchange an authorization code from the PKCE flow for a user-controlled API key
   */
  async exchangeAuthCodeForAPIKey(request, options) {
    return unwrapAsync(oAuthExchangeAuthCodeForAPIKey(this, request, options));
  }
  /**
   * Create authorization code
   *
   * @remarks
   * Create an authorization code for the PKCE flow to generate a user-controlled API key
   */
  async createAuthCode(request, options) {
    return unwrapAsync(oAuthCreateAuthCode(this, request, options));
  }
};

// node_modules/@openrouter/sdk/esm/funcs/parametersGetParameters.js
function parametersGetParameters(client, security, request, options) {
  return new APIPromise($do23(client, security, request, options));
}
async function $do23(client, security, request, options) {
  const parsed = safeParse3(request, (value) => GetParametersRequest$outboundSchema.parse(value), "Input validation failed");
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = null;
  const pathParams = {
    author: encodeSimple("author", payload.author, {
      explode: false,
      charEncoding: "percent"
    }),
    slug: encodeSimple("slug", payload.slug, {
      explode: false,
      charEncoding: "percent"
    })
  };
  const path = pathToFunc("/parameters/{author}/{slug}")(pathParams);
  const query = encodeFormQuery({
    "provider": payload.provider
  });
  const headers = new Headers(compactMap({
    Accept: "application/json"
  }));
  const requestSecurity = resolveSecurity([
    {
      fieldName: "Authorization",
      type: "http:bearer",
      value: security == null ? void 0 : security.bearer
    }
  ]);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "getParameters",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: security,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "GET",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    query,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["401", "404", "4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, GetParametersResponse$inboundSchema), jsonErr(401, UnauthorizedResponseError$inboundSchema), jsonErr(404, NotFoundResponseError$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/sdk/parameters.js
var ParametersT = class extends ClientSDK {
  /**
   * Get a model's supported parameters and data about which are most popular
   */
  async getParameters(security, request, options) {
    return unwrapAsync(parametersGetParameters(this, security, request, options));
  }
};

// node_modules/@openrouter/sdk/esm/funcs/providersList.js
function providersList(client, options) {
  return new APIPromise($do24(client, options));
}
async function $do24(client, options) {
  const path = pathToFunc("/providers")();
  const headers = new Headers(compactMap({
    Accept: "application/json"
  }));
  const secConfig = await extractSecurity(client._options.apiKey);
  const securityInput = secConfig == null ? {} : { apiKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: (options == null ? void 0 : options.serverURL) ?? client._baseURL ?? "",
    operationID: "listProviders",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.apiKey,
    retryConfig: (options == null ? void 0 : options.retries) || client._options.retryConfig || { strategy: "none" },
    retryCodes: (options == null ? void 0 : options.retryCodes) || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "GET",
    baseURL: options == null ? void 0 : options.serverURL,
    path,
    headers,
    userAgent: client._options.userAgent,
    timeoutMs: (options == null ? void 0 : options.timeoutMs) || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    errorCodes: ["4XX", "500", "5XX"],
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const responseFields = {
    HttpMeta: { Response: response, Request: req }
  };
  const [result] = await match(json(200, ListProvidersResponse$inboundSchema), jsonErr(500, InternalServerResponseError$inboundSchema), fail("4XX"), fail("5XX"))(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}

// node_modules/@openrouter/sdk/esm/sdk/providers.js
var Providers = class extends ClientSDK {
  /**
   * List all providers
   */
  async list(options) {
    return unwrapAsync(providersList(this, options));
  }
};

// node_modules/@openrouter/sdk/esm/sdk/sdk.js
var OpenRouter = class extends ClientSDK {
  get beta() {
    return this._beta ?? (this._beta = new Beta(this._options));
  }
  get analytics() {
    return this._analytics ?? (this._analytics = new Analytics(this._options));
  }
  get credits() {
    return this._credits ?? (this._credits = new Credits(this._options));
  }
  get embeddings() {
    return this._embeddings ?? (this._embeddings = new Embeddings(this._options));
  }
  get generations() {
    return this._generations ?? (this._generations = new Generations(this._options));
  }
  get models() {
    return this._models ?? (this._models = new Models(this._options));
  }
  get endpoints() {
    return this._endpoints ?? (this._endpoints = new Endpoints(this._options));
  }
  get parameters() {
    return this._parameters ?? (this._parameters = new ParametersT(this._options));
  }
  get providers() {
    return this._providers ?? (this._providers = new Providers(this._options));
  }
  get apiKeys() {
    return this._apiKeys ?? (this._apiKeys = new APIKeys(this._options));
  }
  get oAuth() {
    return this._oAuth ?? (this._oAuth = new OAuth(this._options));
  }
  get chat() {
    return this._chat ?? (this._chat = new Chat(this._options));
  }
  get completions() {
    return this._completions ?? (this._completions = new Completions(this._options));
  }
};

// src/background/index.js
var DEV_API_KEY = "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";
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateDebateStreaming") {
    handleStreamingDebate(request, sender.tab.id);
    return true;
  }
  if (request.action === "getQuestion") {
    sendResponse({ error: "Legacy quiz mode not supported. Use debate mode." });
    return false;
  }
});
async function handleStreamingDebate(request, tabId) {
  const { productContext, settings } = request;
  const apiKey = (settings == null ? void 0 : settings.apiKey) || DEV_API_KEY;
  console.log("[Background] Using API key:", {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey == null ? void 0 : apiKey.substring(0, 10),
    model: (settings == null ? void 0 : settings.model) || "anthropic/claude-3-haiku",
    source: (settings == null ? void 0 : settings.apiKey) ? "settings" : "fallback"
  });
  const openrouter = new OpenRouter({
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": chrome.runtime.getURL(""),
      "X-Title": "Shopping Debate Extension"
    }
  });
  try {
    const responses = {};
    responses.enabler = await streamPersonality(
      "enabler",
      buildEnablerPrompt(productContext),
      openrouter,
      settings,
      tabId
    );
    await sleep(400);
    responses.skeptic = await streamPersonality(
      "skeptic",
      buildSkepticPrompt(productContext),
      openrouter,
      settings,
      tabId
    );
    await sleep(400);
    await streamPersonality(
      "mediator",
      buildMediatorPrompt(productContext, responses),
      openrouter,
      settings,
      tabId
    );
    chrome.tabs.sendMessage(tabId, {
      type: "debateComplete"
    });
  } catch (error2) {
    console.error("Debate generation error:", error2);
    chrome.tabs.sendMessage(tabId, {
      type: "debateError",
      error: error2.message || "Failed to generate debate"
    });
  }
}
async function streamPersonality(personality, prompt, openrouter, settings, tabId) {
  var _a2, _b, _c;
  chrome.tabs.sendMessage(tabId, {
    type: "personalityStart",
    personality
  });
  let fullResponse = "";
  try {
    const stream = await openrouter.chat.send({
      model: settings.model || "anthropic/claude-3-haiku",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 250,
      temperature: 0.8,
      stream: true
    });
    for await (const chunk of stream) {
      const content = ((_c = (_b = (_a2 = chunk.choices) == null ? void 0 : _a2[0]) == null ? void 0 : _b.delta) == null ? void 0 : _c.content) || "";
      if (content) {
        fullResponse += content;
        chrome.tabs.sendMessage(tabId, {
          type: "personalityChunk",
          personality,
          content
        });
      }
    }
    chrome.tabs.sendMessage(tabId, {
      type: "personalityComplete",
      personality
    });
    return fullResponse;
  } catch (error2) {
    console.error(`Error streaming ${personality}:`, error2);
    throw error2;
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
  return new Promise((resolve) => setTimeout(resolve, ms));
}
console.log("Shopping Debate background service worker loaded with OpenRouter SDK");
