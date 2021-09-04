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
 * except for that it will prefix package names for module ids, since
 * there maybe collisions among brick packages.
 *
 * Copied from https://github.com/webpack/webpack/blob/v4.46.0/lib/HashedModuleIdsPlugin.js
 */
class BrickHashedModuleIdsPlugin {
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
          packageName: {
            description: "The brick package name",
            type: "string",
            minLength: 1,
          },
        },
        required: (schema.required || []).concat("packageName"),
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
        packageName: null,
      },
      options
    );
  }

  apply(compiler) {
    const options = this.options;
    compiler.hooks.compilation.tap(
      "BrickHashedModuleIdsPlugin",
      (compilation) => {
        const usedIds = new Set();
        compilation.hooks.beforeModuleIds.tap(
          "BrickHashedModuleIdsPlugin",
          (modules) => {
            for (const module of modules) {
              if (module.id === null && module.libIdent) {
                const id = module.libIdent({
                  context: this.options.context || compiler.options.context,
                });
                const hash = createHash(options.hashFunction);
                hash.update(id);
                const hashId = /** @type {string} */ (
                  hash.digest(options.hashDigest)
                );
                // !!! Here's the replacement.
                const getFullHashId = (subHashId) =>
                  `bricks/${options.packageName}:${subHashId}`;
                let len = options.hashDigestLength;
                while (usedIds.has(getFullHashId(hashId.substr(0, len)))) len++;
                module.id = getFullHashId(hashId.substr(0, len));
                usedIds.add(module.id);
              }
            }
          }
        );
      }
    );
  }
}

module.exports = BrickHashedModuleIdsPlugin;
