let supports: boolean | undefined;

export function supportsAdoptingStyleSheets(): boolean {
  if (supports === undefined) {
    supports = !!(
      window.ShadowRoot &&
      // (window.ShadyCSS === undefined || window.ShadyCSS.nativeShadow) &&
      "adoptedStyleSheets" in Document.prototype &&
      "replace" in CSSStyleSheet.prototype
    );
  }
  return supports;
}
