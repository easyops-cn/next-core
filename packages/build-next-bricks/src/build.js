import path from "node:path";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import webpack from "webpack";
import rimraf from "rimraf";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import postcssPresetEnv from "postcss-preset-env";
import EmitBricksJsonPlugin from "./EmitBricksJsonPlugin.js";
// import postcssNested from 'postcss-nested';

const require = createRequire(import.meta.url);

const { SourceMapDevToolPlugin } = webpack;
const { ModuleFederationPlugin } = webpack.container;

/**
 * @param {import("@next-core/build-next-bricks").BuildNextBricksConfig} config
 */
export default async function build(config) {
  const packageDir = process.cwd();
  const isContainer = config.type === "container";
  const mode = config.mode || process.env.NODE_ENV;

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

  const outputPath = path.join(packageDir, "dist");

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

  const chunksDir = isContainer ? "" : "chunks/";

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
      filename:
        mode === "development"
          ? `${chunksDir}[name].bundle.js`
          : `${chunksDir}[name].[contenthash].js`,
      // filename: "[name].bundle.js",
      publicPath: "auto",
      hashDigestLength: 8,
      chunkFilename:
        mode === "development"
          ? `${chunksDir}[name].js`
          : `${chunksDir}[name].[contenthash].js`,
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
          sideEffects: true,
          use: [
            config.extractCss ? MiniCssExtractPlugin.loader : "style-loader",
            {
              loader: "css-loader",
              options: {
                sourceMap: false,
              },
            },
            {
              loader: "postcss-loader",
              options: {
                sourceMap: false,
                postcssOptions: {
                  plugins: [
                    // postcssNested(),
                    postcssPresetEnv(),
                  ],
                },
              },
            },
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
        ...(config.moduleRules || []),
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
              filename:
                mode === "development"
                  ? "index.bundle.js"
                  : "index.[contenthash].js",
              exposes: config.exposes,
            }),
      }),
      ...(config.extractCss
        ? [
            new MiniCssExtractPlugin({
              filename:
                mode === "development"
                  ? "[name].bundle.css"
                  : "[name].[contenthash].css",
              // chunkFilename: "[id].css",
            }),
          ]
        : []),
      ...(isContainer
        ? []
        : [
            new EmitBricksJsonPlugin({
              packageName,
              bricks: Object.values(config.exposes).map(
                (expose) => expose.name
              ),
            }),
          ]),
      ...(config.plugins || []),
    ],
  });
}
