import path from "node:path";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import webpack from "webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import postcssPresetEnv from "postcss-preset-env";
import cssnano from "cssnano";
import cssnanoPresetLite from "cssnano-preset-lite";
import EmitBricksJsonPlugin from "./EmitBricksJsonPlugin.js";
import getCamelPackageName from "./getCamelPackageName.js";

const require = createRequire(import.meta.url);

const { SourceMapDevToolPlugin, IgnorePlugin, ContextReplacementPlugin } =
  webpack;
const { ModuleFederationPlugin } = webpack.container;

const getCssLoaders = (cssOptions) => [
  {
    loader: "css-loader",
    options: {
      sourceMap: false,
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
 * @param {import("@next-core/build-next-bricks").BuildNextBricksConfig} config
 */
export default async function build(config) {
  const packageDir = process.cwd();
  // const isContainer = config.type === "container";
  const isBricks = !config.type || config.type === "bricks";
  const mode = config.mode || process.env.NODE_ENV;

  const packageJsonFile = await readFile(
    path.join(packageDir, "package.json"),
    { encoding: "utf-8" }
  );
  const packageJson = JSON.parse(packageJsonFile);
  const packageName = packageJson.name.split("/").pop();
  const camelPackageName = getCamelPackageName(packageName);
  const libName = isBricks ? `bricks/${packageName}` : config.type;

  const sharedPackages = [
    "react",
    "react-dom",
    "history",
    "i18next",
    "react-i18next",
    "lodash",
    "@next-core/element",
    "@next-core/react-element",
    "@next-core/react-runtime",
    "@next-core/runtime",
    "@next-core/brick-http",
    "@next-core/cook",
    "@next-core/utils/general",
    "@next-core/utils/storyboard",
    "@next-core/theme",
  ];

  /** @type {import("@next-core/build-next-bricks").BuildNextBricksConfig["moduleFederationShared"]} */
  const shared = Object.fromEntries(
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
            depPackageJsonPath = require.resolve(`${depPkgName}/package.json`, {
              paths: [packageDir],
            });
          } catch (e) {
            console.error(`Shared package not found: "${dep}"`);
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
              singleton: true,
              version: depPackageJson.version,
              requiredVersion: packageJson.dependencies?.[depPkgName],
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
  const processors = [];
  /** @type {Record<string, string[]>} */
  let dependencies = {};
  if (isBricks) {
    for (const key of Object.keys(config.exposes)) {
      const segments = key.split("/");
      const name = segments.pop();
      const namespace = segments.pop();
      if (namespace === "processors") {
        processors.push(`${camelPackageName}.${name}`);
      } else {
        bricks.push(`${packageName}.${name}`);
      }
    }
    dependencies = Object.fromEntries(
      Object.entries(config.dependencies).map(([key, value]) => [
        `${packageName}.${key}`,
        value,
      ])
    );
  }

  /** @type {Record<string, { import: string; name: string; }>} */
  const extraExposes = {};
  // const initializeTsPath = path.join(packageDir, "src/initialize.ts");
  // if (fs.existsSync(initializeTsPath)) {
  //   extraExposes.initialize = {
  //     import: `./${path.relative(packageDir, initializeTsPath)}`,
  //     name: "initialize",
  //   };
  // }

  const outputPath = path.join(packageDir, "dist");
  const chunksDir = isBricks ? "chunks/" : "";

  return webpack({
    entry: config.entry || {
      main: "./src/index",
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
      filename: `${chunksDir}[name].${
        mode === "development" ? "bundle" : "[contenthash]"
      }.js`,
      // filename: "[name].bundle.js",
      publicPath: "auto",
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
          // resourceQuery: {
          //   not: /shadow/
          // },
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
        // {
        //   test: /\.css$/,
        //   resourceQuery: /shadow/,
        //   use: [
        //     ...getCssLoaders({
        //       exportType: "string",
        //     }),
        //   ],
        // },
        {
          test: /\.[tj]sx?$/,
          loader: "babel-loader",
          exclude: /node_modules/,
          options: {
            rootMode: "upward",
          },
        },
        {
          test: /\.svg$/i,
          issuer(input) {
            // The issuer is null (or an empty string) for dynamic import
            return !input || /\.[jt]sx?$/.test(input);
          },
          use: [
            {
              loader: "babel-loader",
              options: {
                rootMode: "upward",
              },
            },
            {
              loader: "@svgr/webpack",
              options: {
                babel: false,
                icon: true,
                svgoConfig: {
                  plugins: [
                    {
                      name: "preset-default",
                      params: {
                        overrides: {
                          // Keep `viewbox`
                          removeViewBox: false,
                          convertColors: {
                            currentColor: true,
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
        ...(config.moduleRules || []),
      ],
    },
    devtool: false,
    optimization: config.optimization,
    plugins: [
      new SourceMapDevToolPlugin({
        filename: "[file].map",
        // Do not generate source map for these vendors:
        exclude: [
          // "polyfill",
          // No source maps for React and ReactDOM
          /^chunks\/(?:2?784|(?:2?8)?316)(?:\.[0-9a-f]+)?\.js$/,
          /^chunks\/(?:vendors-)?node_modules_/,
          /^chunks\/(?:easyops|fa)-icons\//,
        ],
      }),

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
              processors,
              dependencies,
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
  });
}
