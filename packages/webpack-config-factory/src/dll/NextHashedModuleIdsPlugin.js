/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";
const createHash = require("webpack/lib/util/createHash");

const validateOptions = require("schema-utils");
const schema = require("webpack/schemas/plugins/HashedModuleIdsPlugin.json");

/** @typedef {import("webpack/declarations/plugins/HashedModuleIdsPlugin").HashedModuleIdsPluginOptions} HashedModuleIdsPluginOptions */

/**
 * This plugin works as the same as `webpack.HashedModuleIdsPlugin`,
 * except for that it will replace all occurrences of `@next-core/*`
 * by `@easyops/*` for module ids, since we want to keep the backward
 * compatibility of dll manifest.
 *
 * Copied from https://github.com/webpack/webpack/blob/v4.46.0/lib/HashedModuleIdsPlugin.js
 */
class NextHashedModuleIdsPlugin {
  /**
   * @param {HashedModuleIdsPluginOptions=} options options object
   */
  constructor(options) {
    if (!options) options = {};

    validateOptions(
      {
        ...schema,
        properties: {
          ...schema.properties,
          migrateToBrickNextV3: {
            type: "boolean",
          },
        },
      },
      options,
      "Hashed Module Ids Plugin"
    );

    /** @type {HashedModuleIdsPluginOptions} */
    this.options = Object.assign(
      {
        context: null,
        hashFunction: "md4",
        hashDigest: "base64",
        hashDigestLength: 4,
      },
      options
    );
  }

  apply(compiler) {
    const options = this.options;
    compiler.hooks.compilation.tap(
      "NextHashedModuleIdsPlugin",
      (compilation) => {
        const usedIds = new Set();
        compilation.hooks.beforeModuleIds.tap(
          "NextHashedModuleIdsPlugin",
          (modules) => {
            for (const module of modules) {
              if (module.id === null && module.libIdent) {
                // !!! Here's the replacement.
                const originalId = module.libIdent({
                  context: options.context || compiler.options.context,
                });
                const id = (
                  this.options.migrateToBrickNextV3
                    ? originalId
                        .replace(
                          "@next-core/brick-kit-v3",
                          "@next-core/brick-kit"
                        )
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
                          "/node_modules/@next-core/react-i18next-v3/index.esm.js",
                          "/node_modules/react-i18next/dist/es/index.js"
                        )
                        .replace(
                          "/node_modules/@next-core/i18next-v3/index.esm.js",
                          "/node_modules/i18next/dist/esm/i18next.js"
                        )
                    : originalId
                )
                  .replace("@next-core/", "@easyops/")
                  .replace(
                    "@babel/runtime/helpers/regeneratorRuntime",
                    "regenerator-runtime/runtime"
                  );
                const hash = createHash(options.hashFunction);
                hash.update(id);
                const hashId = /** @type {string} */ (
                  hash.digest(options.hashDigest)
                );
                let len = options.hashDigestLength;
                while (usedIds.has(hashId.substr(0, len))) len++;
                module.id = hashId.substr(0, len);
                usedIds.add(module.id);
              }
            }
          }
        );
      }
    );
  }
}

module.exports = NextHashedModuleIdsPlugin;
