// istanbul ignore file
export * from "@next-core/cook";

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
