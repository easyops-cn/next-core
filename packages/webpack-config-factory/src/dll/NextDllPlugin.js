/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

const DllEntryPlugin = require("webpack/lib/DllEntryPlugin");
const FlagAllModulesAsUsedPlugin = require("webpack/lib/FlagAllModulesAsUsedPlugin");
const NextLibManifestPlugin = require("./NextLibManifestPlugin");

const validateOptions = require("schema-utils");
const schema = require("webpack/schemas/plugins/DllPlugin.json");

/** @typedef {import("webpack/declarations/plugins/DllPlugin").DllPluginOptions} DllPluginOptions */

/**
 * This plugin works as the same as `webpack.DllPlugin`,
 * except for the overridden `LibManifestPlugin`, which
 * will replace module ids from `@next-core/*` to `@easyops/*`.
 *
 * Copied from https://github.com/webpack/webpack/blob/v4.46.0/lib/DllPlugin.js
 */
class NextDllPlugin {
  /**
   * @param {DllPluginOptions} options options object
   */
  constructor(options) {
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
      "Dll Plugin"
    );
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.entryOption.tap("NextDllPlugin", (context, entry) => {
      const itemToPlugin = (item, name) => {
        if (Array.isArray(item)) {
          return new DllEntryPlugin(context, item, name);
        }
        throw new Error("NextDllPlugin: supply an Array as entry");
      };
      if (typeof entry === "object" && !Array.isArray(entry)) {
        Object.keys(entry).forEach((name) => {
          itemToPlugin(entry[name], name).apply(compiler);
        });
      } else {
        itemToPlugin(entry, "main").apply(compiler);
      }
      return true;
    });
    // !!! Here's the replacement.
    new NextLibManifestPlugin(this.options).apply(compiler);
    if (!this.options.entryOnly) {
      new FlagAllModulesAsUsedPlugin("NextDllPlugin").apply(compiler);
    }
  }
}

module.exports = NextDllPlugin;
