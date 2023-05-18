// Ref https://github.com/tc39/proposal-global
// In addition, the es6-shim had to switch from Function('return this')()
// due to CSP concerns, such that the current check to handle browsers,
// node, web workers, and frames is:
// istanbul ignore next
// eslint-disable-next-line @typescript-eslint/ban-types
function getGlobal(): object {
  // the only reliable means to get the global object is
  // `Function('return this')()`
  // However, this causes CSP violations in Chrome apps.
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw new Error("unable to locate global object");
}

/**
 * There are chances to construct a `Function` from a string, etc.
 * ```
 * ((a,b)=>a[b])(()=>1, 'constructor')('console.log(`yo`)')()
 * ```
 */
const reservedObjects = new WeakSet([
  // `Function("...")` is considered *extremely vulnerable*.
  Function,
  // `Object.assign()` is considered vulnerable.
  Object,
  // `prototype` is considered vulnerable.
  Function.prototype,
  Object.prototype,
  // Global `window` is considered vulnerable, too.
  getGlobal(),
]);

export function sanitize(cooked: unknown): void {
  // eslint-disable-next-line @typescript-eslint/ban-types
  if (reservedObjects.has(cooked as object)) {
    throw new TypeError("Cannot access reserved objects such as `Function`.");
  }
}

const allowedConstructors = new WeakSet([
  Array,
  Map,
  Set,
  URLSearchParams,
  WeakMap,
  WeakSet,
  RegExp,
]);

export function isAllowedConstructor(constructor: unknown): boolean {
  // `Date` maybe mocked when running tests for storyboard functions.
  return (
    allowedConstructors.has(constructor as ArrayConstructor) ||
    constructor === Date
  );
}
