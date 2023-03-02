/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

const path = require("path");
const asyncLib = require("neo-async");
const SingleEntryDependency = require("webpack/lib/dependencies/SingleEntryDependency");

/**
 * This plugin works as the same as `webpack/lib/LibManifestPlugin`,
 * except for that it will replace all occurrences of `@next-core/*`
 * by `@easyops/*` for module ids, since we want to keep the backward
 * compatibility of dll manifest.
 *
 * Copied from https://github.com/webpack/webpack/blob/v4.46.0/lib/LibManifestPlugin.js
 */
class NextLibManifestPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync(
      "NextLibManifestPlugin",
      (compilation, callback) => {
        asyncLib.forEach(
          compilation.chunks,
          (chunk, callback) => {
            if (!chunk.isOnlyInitial()) {
              callback();
              return;
            }
            const targetPath = compilation.getPath(this.options.path, {
              hash: compilation.hash,
              chunk,
            });
            const name =
              this.options.name &&
              compilation.getPath(this.options.name, {
                hash: compilation.hash,
                chunk,
              });
            const manifest = {
              name,
              type: this.options.type,
              content: Array.from(chunk.modulesIterable, (module) => {
                if (
                  this.options.entryOnly &&
                  !module.reasons.some(
                    (r) => r.dependency instanceof SingleEntryDependency
                  )
                ) {
                  return;
                }
                if (module.libIdent) {
                  const ident = module.libIdent({
                    context: this.options.context || compiler.options.context,
                  });
                  if (ident) {
                    return {
                      // !!! Here's the replacement.
                      ident: (this.options.migrateToBrickNextV3
                        ? ident
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
                        : ident
                      )
                        .replace("@next-core/", "@easyops/")
                        .replace(
                          "@babel/runtime/helpers/regeneratorRuntime",
                          "regenerator-runtime/runtime"
                        ),
                      data: {
                        id: module.id,
                        buildMeta: module.buildMeta,
                      },
                    };
                  }
                }
              })
                .filter(Boolean)
                .reduce((obj, item) => {
                  obj[item.ident] = item.data;
                  return obj;
                }, Object.create(null)),
            };
            // Apply formatting to content if format flag is true;
            const manifestContent = this.options.format
              ? JSON.stringify(manifest, null, 2)
              : JSON.stringify(manifest);
            const content = Buffer.from(manifestContent, "utf8");
            compiler.outputFileSystem.mkdirp(
              path.dirname(targetPath),
              (err) => {
                if (err) return callback(err);
                compiler.outputFileSystem.writeFile(
                  targetPath,
                  content,
                  callback
                );
              }
            );
          },
          callback
        );
      }
    );
  }
}
module.exports = NextLibManifestPlugin;
