// const path = require("path");
// const { existsSync } = require("fs");
// const { readFile } = require("fs/promises");
// const webpack = require("webpack");
// const rimraf = require("rimraf");
import path from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import webpack from "webpack";
import rimraf from "rimraf";

const require = createRequire(import.meta.url);

const { SourceMapDevToolPlugin } = webpack;
const { ModuleFederationPlugin } = webpack.container;

try {
  const startTime = Date.now();
  const packageDir = process.cwd();
  const outputPath = path.join(packageDir, "dist");
  // const isDevelopment = process.env.NODE_ENV === "development";
  const bnbConfigJs = path.join(packageDir, "bnb.config.js");
  let bnbConfig = {};
  if (existsSync(bnbConfigJs)) {
    bnbConfig = require(bnbConfigJs);
  }
  const isContainer = bnbConfig.type === "container";
  const mode = bnbConfig.mode || process.env.NODE_ENV;

  const packageJsonFile = await readFile(
    path.join(packageDir, "package.json"),
    { encoding: "utf-8" }
  );
  const packageJson = JSON.parse(packageJsonFile);
  const packageName = packageJson.name.split("/").pop();
  const libName = `bricks/${packageName}`;

  const sharedPackages = ["react", "react-dom", "@next-core/element"];

  const shared = Object.fromEntries(
    await Promise.all(
      sharedPackages.map(async (dep) => {
        const depPackageJsonPath = require.resolve(`${dep}/package.json`, {
          paths: [packageDir],
        });
        const depPackageJsonFile = await readFile(depPackageJsonPath, {
          encoding: "utf-8",
        });
        const depPackageJson = JSON.parse(depPackageJsonFile);
        return [
          dep,
          {
            singleton: true,
            version: depPackageJson.version,
            requiredVersion: packageJson.dependencies?.[dep],
          },
        ];
      })
    )
  );

  // console.log(packageName, "shared:", shared);

  await new Promise((resolve, reject) => {
    rimraf(outputPath, (err) => {
      if (err) {
        console.error("Failed to clean dist:");
        reject(err);
      } else {
        resolve();
      }
    });
  });

  await new Promise((resolve, reject) => {
    webpack(
      {
        entry: {
          // ...(isContainer
          //   ? {
          //       polyfill: "./src/polyfill",
          //     }
          //   : null),
          index: "./src/index",
          ...bnbConfig.entry,
        },
        mode,
        devServer: {
          static: {
            directory: outputPath,
          },
          port: 3001,
        },
        output: {
          path: outputPath,
          // filename: mode === "development" ? "[name].bundle.js" : "[name].[contenthash].js",
          filename: "[name].bundle.js",
          publicPath: "auto",
          hashDigestLength: 8,
        },
        resolve: {
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
          extensionAlias: {
            ".js": [".ts", ".tsx", ".js", ".jsx"],
          },
        },
        module: {
          rules: [
            {
              test: /\.[tj]sx?$/,
              loader: "babel-loader",
              exclude: /node_modules/,
              options: {
                rootMode: "upward",
              },
            },
            ...(bnbConfig.rules || []),
          ],
        },
        devtool: false,
        plugins: [
          new SourceMapDevToolPlugin({
            filename: "[file].map",
            // Do not generate source map for these vendors:
            exclude: [
              "polyfill",
              "316", // ReactDOM
              "784", // React
            ],
          }),
          new ModuleFederationPlugin({
            name: libName,
            shared,
            ...(isContainer
              ? null
              : {
                  library: { type: "window", name: libName },
                  filename: "remoteEntry.js",
                  exposes:
                    libName === "bricks/basic"
                      ? {
                          "./x-button": {
                            import: "./src/x-button",
                            name: "x-button",
                          },
                          "./y-button": {
                            import: "./src/y-button",
                            name: "y-button",
                          },
                        }
                      : {
                          "./f-input": {
                            import: "./src/f-input",
                            name: "f-input",
                          },
                          "./f-select": {
                            import: "./src/f-select",
                            name: "f-select",
                          },
                          "./all": {
                            import: "./src/bootstrap",
                            name: "all",
                          },
                        },
                }),
          }),
          ...(bnbConfig.plugins || []),
        ],
      },
      (err, stats) => {
        if (err || stats.hasErrors()) {
          console.error("Failed to build bricks:");
          reject(err || stats.toString());
        } else {
          resolve();
        }
      }
    );
  });

  // Done
  console.log(
    `Build bricks done in ${((Date.now() - startTime) / 1000).toFixed(2)}s.`
  );
} catch (e) {
  console.error(e);
  process.exitCode = 1;
}
