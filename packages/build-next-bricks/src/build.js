import path from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import webpack from "webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import postcssPresetEnv from "postcss-preset-env";
import cssnano from "cssnano";
import cssnanoPresetLite from "cssnano-preset-lite";
import _ from "lodash";
import EmitBricksJsonPlugin from "./EmitBricksJsonPlugin.js";
import getCamelPackageName from "./getCamelPackageName.js";
import getSvgrLoaders from "./getSvgrLoaders.js";

/**
 * @typedef {T | Array<T>} MaybeArray<T>
 * @template {string} T
 */

/** @typedef {import("@next-core/build-next-bricks").BuildNextBricksConfig} BuildNextBricksConfig */

const require = createRequire(import.meta.url);

const { SourceMapDevToolPlugin, IgnorePlugin, ContextReplacementPlugin } =
  webpack;
const { ModuleFederationPlugin } = webpack.container;

const getCssLoaders = (cssOptions) => [
  {
    loader: "css-loader",
    options: {
      sourceMap: false,
      importLoaders: 1,
      ...cssOptions,
    },
  },
  {
    loader: "postcss-loader",
    options: {
      sourceMap: false,
      postcssOptions: {
        plugins: [
          postcssPresetEnv({
            stage: 3,
            features: {
              "nesting-rules": true,
            },
          }),
          cssnano({
            preset: cssnanoPresetLite({
              discardComments: {
                removeAll: true,
              },
            }),
          }),
        ],
      },
    },
  },
];

/**
 * @param {BuildNextBricksConfig} config
 * @returns {import("webpack").Configuration}
 */
async function getWebpackConfig(config) {
  const packageDir = process.cwd();
  const isBricks = !config.type || config.type === "bricks";
  const mode = config.mode || process.env.NODE_ENV;

  const packageJsonFile = await readFile(
    path.join(packageDir, "package.json"),
    "utf-8"
  );
  const packageJson = JSON.parse(packageJsonFile);
  const packageName = packageJson.name.split("/").pop();
  const camelPackageName = getCamelPackageName(packageName);
  const libName = isBricks ? `bricks/${packageName}` : config.type;

  /** @type {string[]} */
  let commonBricks;
  const commonBricksJsonFile = path.join(
    packageDir,
    "../../shared/common-bricks/common-bricks.json"
  );
  if (existsSync(commonBricksJsonFile)) {
    const commonBricksJson = JSON.parse(
      await readFile(commonBricksJsonFile, "utf-8")
    );

    /** @type {Set<string, string>} */
    const commonBricksMap = new Map();
    for (const [pkg, bricks] of Object.entries(commonBricksJson)) {
      for (const brick of bricks) {
        const existedPkg = commonBricksMap.get(brick);
        if (existedPkg && existedPkg !== pkg) {
          throw new Error(
            `Conflicted common brick: "${brick}" in package "${existedPkg}" and "${pkg}"`
          );
        }
        commonBricksMap.set(brick, pkg);
      }
    }

    commonBricks = Object.prototype.hasOwnProperty.call(
      commonBricksJson,
      packageName
    )
      ? commonBricksJson[packageName]
      : [];
  } else {
    commonBricks = [];
  }

  const sharedSingletonPackages = [
    "history",
    "i18next",
    "lodash",
    "moment",
    "moment/locale/zh-cn.js",
    "js-yaml",
    "i18next-browser-languagedetector",
    "react-i18next",
    "@babel/parser",
    "@easyops-cn/brick-next-pipes",
    "@next-core/pipes",
    "@next-core/runtime",
    "@next-core/easyops-runtime",
    "@next-core/http",
    "@next-core/theme",
    "@next-core/cook",
    "@next-core/i18n",
    "@next-core/i18n/react",
    "@next-core/inject",
    "@next-core/loader",
    "@next-core/supply",
    "@next-core/utils/general",
    "@next-core/utils/storyboard",
  ];

  const sharedPackages = [
    "react",
    "react-dom",
    "@next-core/element",
    "@next-core/react-element",
    "@next-core/react-runtime",
    ...sharedSingletonPackages,
  ];

  /** @type {BuildNextBricksConfig["moduleFederationShared"]} */
  const shared =
    config.moduleFederationShared === false
      ? undefined
      : Object.fromEntries(
          (
            await Promise.all(
              sharedPackages.map(async (dep) => {
                /** @type {string} */
                let depPackageJsonPath;
                const depPkgName = dep
                  .split("/")
                  .slice(0, dep.startsWith("@") ? 2 : 1)
                  .join("/");
                try {
                  depPackageJsonPath = require.resolve(
                    `${depPkgName}/package.json`,
                    {
                      paths: [packageDir],
                    }
                  );
                } catch (e) {
                  console.warn(`Shared package not found: "${dep}"`);
                  return;
                }
                const depPackageJsonFile = await readFile(depPackageJsonPath, {
                  encoding: "utf-8",
                });
                const depPackageJson = JSON.parse(depPackageJsonFile);
                const customized = config.moduleFederationShared?.[dep];
                if (typeof customized === "string") {
                  return;
                }
                return [
                  dep,
                  {
                    singleton: sharedSingletonPackages.includes(dep),
                    version: depPackageJson.version,
                    requiredVersion:
                      packageJson.peerDependencies?.[depPkgName] ??
                      packageJson.devDependencies?.[depPkgName] ??
                      packageJson.dependencies?.[depPkgName],
                    ...customized,
                  },
                ];
              })
            )
          ).filter(Boolean)
        );

  // console.log(packageName, "shared:", shared);

  /** @type {string[]} */
  const bricks = [];
  /** @type {string[]} */
  const elements = [];
  /** @type {string[]} */
  const processors = [];
  if (isBricks) {
    for (const [key, val] of Object.entries(config.exposes)) {
      const segments = key.split("/");
      const name = segments.pop();
      const namespace = segments.pop();
      if (namespace === "processors") {
        processors.push(`${camelPackageName}.${name}`);
      } else {
        if (val[Symbol.for("noNamespace")]) {
          elements.push(name);
        } else {
          bricks.push(`${packageName}.${name}`);
        }
      }
    }
  }

  const invalidElements = _.difference(elements, commonBricks);
  if (invalidElements.length > 0) {
    throw new Error(
      `Find common bricks in \`${packageName}\` which are not in common-bricks.json: ${invalidElements.join(
        ", "
      )}`
    );
  }
  const missingElements = _.difference(commonBricks, elements);
  if (missingElements.length > 0) {
    throw new Error(
      `Missing common bricks in \`${packageName}\`: ${missingElements.join(
        ", "
      )}`
    );
  }

  /** @type {Record<string, { import: string; name: string; }>} */
  const extraExposes = {};

  const outputPath = path.join(packageDir, config.outputPath ?? "dist");
  const chunksDir = isBricks ? "chunks/" : "";

  const imageAssetFilename = config.imageAssetFilename ?? "images/[hash][ext]";

  return {
    entry: config.entry || {
      main: "./src/index",
    },
    mode,
    output: {
      path: outputPath,
      filename: `${chunksDir}[name].${
        mode === "development" ? "bundle" : "[contenthash]"
      }.js`,
      // filename: "[name].bundle.js",
      publicPath:
        mode === "development"
          ? config.devOnlyOutputPublicPath ?? "auto"
          : "auto",
      hashDigestLength: 8,
      chunkFilename: `${chunksDir}[name]${
        mode === "development" ? "" : ".[contenthash]"
      }.js`,
      clean: true,
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
          test: /\.css$/,
          exclude: /\.(module|shadow|lazy)\.css$/,
          sideEffects: true,
          use: [
            config.extractCss ? MiniCssExtractPlugin.loader : "style-loader",
            ...getCssLoaders(),
          ],
        },
        {
          test: /\.shadow\.css$/,
          use: [
            ...getCssLoaders({
              exportType: "string",
            }),
          ],
        },
        {
          test: /\.module\.css$/,
          sideEffects: true,
          use: [
            config.extractCss ? MiniCssExtractPlugin.loader : "style-loader",
            ...getCssLoaders({
              modules: {
                localIdentName: "[local]--[hash:base64:8]",
              },
            }),
          ],
        },
        {
          test: /\.[tj]sx?$/,
          loader: "babel-loader",
          exclude: /node_modules/,
          options: {
            rootMode: "upward",
          },
        },
        {
          // Images
          test: new RegExp(
            `\\.(?:${[
              "png",
              "jpg",
              "jpeg",
              "gif",
              ...(config.svgRules || config.svgAsReactComponent ? [] : ["svg"]),
            ].join("|")})$`,
            "i"
          ),
          type: "asset/resource",
          generator: {
            filename: imageAssetFilename,
          },
        },
        ...(config.svgRules ??
          (config.svgAsReactComponent
            ? [
                {
                  test: /\.svg$/i,
                  type: "asset/resource",
                  // Match `xxx.svg?url`
                  resourceQuery: /url/,
                  generator: {
                    filename: imageAssetFilename,
                  },
                },
                {
                  test: /\.svg$/i,
                  // Exclude issuer of js files
                  issuer: {
                    not: /\.[jt]sx?$/,
                  },
                  type: "asset/resource",
                  generator: {
                    filename: imageAssetFilename,
                  },
                },
                {
                  test: /\.svg$/i,
                  issuer: /\.[jt]sx?$/,
                  // Exclude `xxx.svg?url`
                  resourceQuery: { not: /url/ },
                  use: getSvgrLoaders(),
                },
              ]
            : [])),
        {
          // Fonts
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: "asset/resource",
          generator: {
            filename: "fonts/[hash][ext][query]",
          },
        },
        ...(config.moduleRules ?? []),
      ],
    },
    devtool: false,
    optimization:
      config.optimization ??
      (isBricks
        ? {
            splitChunks: {
              cacheGroups: {
                default: {
                  minChunks: 2,
                  priority: -20,
                  reuseExistingChunk: true,
                },
              },
            },
          }
        : undefined),
    plugins: [
      new SourceMapDevToolPlugin({
        filename: "[file].map",
        // Do not generate source map for these vendors:
        exclude: [
          // No source maps for React,ReactDOM,@next-core/theme
          /^chunks\/(?:2?784|(?:2?8)?316|628|react)(?:\.[0-9a-f]+|\.bundle)?\.js$/,
          /^chunks\/(?:vendors-)?node_modules_/,
          /^chunks\/(?:easyops|fa|antd)-icons\//,
          /^(?:vendors|polyfill)(?:\.[0-9a-f]+|\.bundle)?\.js$/,
        ],
      }),

      ...(config.moduleFederationShared !== false
        ? [
            new ModuleFederationPlugin({
              name: libName,
              shared: {
                ...config.moduleFederationShared,
                ...shared,
              },
              ...(isBricks
                ? {
                    library: { type: "window", name: libName },
                    filename:
                      mode === "development"
                        ? "index.bundle.js"
                        : "index.[contenthash].js",
                    exposes: {
                      ...config.exposes,
                      ...extraExposes,
                    },
                  }
                : null),
            }),
          ]
        : []),

      ...(config.extractCss
        ? [
            new MiniCssExtractPlugin({
              filename:
                mode === "development"
                  ? "[name].bundle.css"
                  : "[name].[contenthash].css",
              chunkFilename:
                mode === "development"
                  ? `${chunksDir}[name].css`
                  : `${chunksDir}[name].[contenthash].css`,
            }),
          ]
        : []),

      ...(isBricks
        ? [
            new EmitBricksJsonPlugin({
              packageName,
              bricks,
              elements,
              processors,
              dependencies: config.dependencies,
              manifest: config.manifest,
              types: config.types,
            }),
          ]
        : []),

      new ContextReplacementPlugin(/moment[/\\]locale$/, /zh|en/),

      new IgnorePlugin({
        // - `esprima` and `buffer` are optional imported by `js-yaml`
        // we don't need them.
        resourceRegExp: /^(?:esprima|buffer)$/,
      }),

      ...(config.plugins || []),
    ],
  };
}

/**
 * @type {{
 *   (config: BuildNextBricksConfig): import("webpack").Compiler;
 *   (config: BuildNextBricksConfig[]): import("webpack").MultiCompiler;
 * }}
 */
const build = async (config) =>
  webpack(
    await (Array.isArray(config)
      ? Promise.all(config.map((conf) => getWebpackConfig(conf)))
      : getWebpackConfig(config))
  );

export default build;
