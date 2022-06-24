const webpack = require("webpack");

/**
 * This plugin extends `webpack.DllReferencePlugin`, and
 * only do one more thing: replace all `@easyops/*` by `@next-core/*`,
 * and `regenerator-runtime/runtime.js` by `@babel/runtime/helpers/regeneratorRuntime.js`.
 *
 * Since we want to keep the backward compatibility of our dll,
 * but the `manifest.json` has already been written as `@easyops/*`,
 * whilst the real packages have been renamed to `@next-core/*`.
 *
 * And since babel v7.18.0, the regenerator runtime helper has been copied into
 * `@babel/runtime/helpers`.
 *
 * Copied from https://github.com/webpack/webpack/blob/v4.46.0/lib/DllReferencePlugin.js
 */
class NextDllReferencePlugin extends webpack.DllReferencePlugin {
  constructor(options) {
    super({
      ...options,
      manifest: {
        ...options.manifest,
        content: Object.fromEntries(
          Object.entries(options.manifest.content).map(([k, v]) => [
            // !!! Here's the replacement.
            k
              .replace("@easyops/", "@next-core/")
              .replace(
                "regenerator-runtime/runtime",
                "@babel/runtime/helpers/regeneratorRuntime"
              ),
            v,
          ])
        ),
      },
    });
  }
}

module.exports = NextDllReferencePlugin;
