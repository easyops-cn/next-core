export * from "./decorators/createDecorators.js";
export * from "./decorators/NextElement.js";

// See https://github.com/lit/lit/blob/78811714eeb00f979e2074a7dd639e8d65903a0f/packages/reactive-element/src/css-tag.ts
export const supportsAdoptingStyleSheets =
  window.ShadowRoot &&
  // (window.ShadyCSS === undefined || window.ShadyCSS.nativeShadow) &&
  "adoptedStyleSheets" in Document.prototype &&
  "replace" in CSSStyleSheet.prototype;
