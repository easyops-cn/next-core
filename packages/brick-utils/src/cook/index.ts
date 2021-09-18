// istanbul ignore file
export * from "./cook";
export * from "./lint";
export * from "./precook";
export * from "./precookFunction";
export * from "./preevaluate";
export * from "./supply";

/** @deprecated */
export const PrecookVisitor = new Proxy(Object.freeze({}), {
  get() {
    return noop;
  },
});

/** @deprecated */
export const PrecookFunctionVisitor = new Proxy(Object.freeze({}), {
  get() {
    return noop;
  },
});

function noop(): void {
  /* noop */
}
