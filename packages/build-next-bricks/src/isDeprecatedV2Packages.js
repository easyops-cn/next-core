// @ts-check
const V2_NEXT_CORE_PACKAGES = new Set([
  "brick-dll",
  "brick-kit",
  "brick-utils",
  "brick-types",
  "brick-http",
  "rollup-config-factory",
  "webpack-config-factory",
  "build-config-factory",
  "jest-config-factory",
  "custom-antd-styles",
  "editor-bricks-helper",
  "fontawesome-library",
]);

const V2_PREFIXES = new Set([
  "@next-dll",
  "@next-libs",
  "@next-sdk",
  "@dll",
  "@libs",
  "@sdk",
]);

/**
 * @param {string} pkg
 * @return {boolean}
 */
export default function isDeprecatedV2Packages(pkg) {
  if (!pkg.startsWith("@")) {
    return false;
  }
  const [prefix, name] = pkg.split("/");
  if (prefix === "@next-core" || prefix === "@easyops") {
    return V2_NEXT_CORE_PACKAGES.has(name);
  }
  return V2_PREFIXES.has(prefix);
}
