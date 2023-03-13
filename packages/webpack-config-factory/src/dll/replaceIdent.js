/**
 *
 * @param ident {string}
 */
function replaceIdent(ident) {
  return ident
    .replace("@next-core/brick-kit-v3", "@next-core/brick-kit")
    .replace(
      "@next-core/brick-http-v3/index.esm.js",
      "@next-core/brick-http/dist/index.esm.js"
    )
    .replace(
      "/node_modules/@next-core/history-v3/index.esm.js",
      "/node_modules/history/esm/history.js"
    )
    .replace(
      "/node_modules/@next-core/lodash-v3/index.bundle.js",
      "/node_modules/lodash/lodash.js"
    )
    .replace(
      "/node_modules/@next-core/moment-v3/index.bundle.js",
      "/node_modules/moment/moment.js"
    )
    .replace(
      "/node_modules/@next-core/js-yaml-v3/index.esm.js",
      "/node_modules/js-yaml/index.js"
    )
    .replace(
      "/node_modules/@next-core/i18next-v3/index.esm.js",
      "/node_modules/i18next/dist/esm/i18next.js"
    );
}

module.exports = replaceIdent;
