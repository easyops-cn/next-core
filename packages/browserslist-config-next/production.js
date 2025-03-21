// Ref https://github.com/browserslist/browserslist#shareable-configs
module.exports = [
  // Desktop browsers
  // with decent display: grid support: https://caniuse.com/css-grid
  // with proper class support: https://bugzilla.mozilla.org/show_bug.cgi?id=1216630
  // with proper web components support: https://caniuse.com/custom-elementsv1
  // with flexbox gap support: https://caniuse.com/flexbox-gap
  // with css ::part support: https://caniuse.com/mdn-css_selectors_part
  // Fallback to versions that doesn't support optional chaining and nullish coalescing
  // Keep JS works with these versions, but some css may not work as expected
  "Edge >= 79",
  "Chrome >= 79",
  "Firefox >= 71",
  "Safari >= 13.0",
  // General targets:
  // "Edge >= 84",
  // "Chrome >= 84",
  // "Firefox >= 72",
  // "Safari >= 14.1",
];
