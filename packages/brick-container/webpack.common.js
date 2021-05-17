const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackTagsPlugin = require("html-webpack-tags-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const manifest = require("@next-core/brick-dll");
const {
  dll: { NextHashedModuleIdsPlugin, NextDllReferencePlugin },
} = require("@next-core/webpack-config-factory");
const packageJson = require("./package.json");
const brickDllVersion = require("@next-core/brick-dll/package.json").version;
const brickKitVersion = require("@next-core/brick-kit/package.json").version;
const brickUtilsVersion = require("@next-core/brick-utils/package.json")
  .version;

const appRoot = path.join(__dirname, "..", "..");
let baseHref = "/";
if (process.env.SUBDIR === "true") {
  baseHref = "/next/";
} else if (process.env.NODE_ENV === "production") {
  baseHref = "<!--# echo var='base_href' default='/' -->";
}

function getDllJsName(packageName, regExp) {
  return fs
    .readdirSync(
      path.join(require.resolve(`${packageName}/package.json`), "../dist"),
      {
        withFileTypes: true,
      }
    )
    .find((dirent) => dirent.isFile() && regExp.test(dirent.name)).name;
}

// Find all `@next-dll/*`.
const dll = Object.keys(packageJson.devDependencies)
  .filter((packageName) => packageName.startsWith("@next-dll/"))
  .map((packageName) => {
    const dllName = packageName.split("/").slice(-1)[0];
    return {
      packageName,
      dllName,
      jsName: getDllJsName(packageName, /^dll-of-[-\w]+\.\w+\.js$/),
    };
  });

const brickDllJsName = getDllJsName("@next-core/brick-dll", /^dll\.\w+\.js$/);

module.exports = {
  context: appRoot,
  entry: {
    polyfill: path.join(__dirname, "src", "polyfill"),
    main: path.join(__dirname, "src", "index"),
  },
  output: {
    path: path.join(__dirname, "dist"),
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    symlinks: false,
  },
  module: {
    rules: [
      {
        // Include ts, tsx, js, and jsx files.
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        options: {
          rootMode: "upward",
        },
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: dll
        .map((d) => d.packageName)
        .concat("@next-core/brick-dll")
        .map((packageName) =>
          path.join(
            require.resolve(`${packageName}/package.json`),
            "../dist/*.js"
          )
        )
        .flatMap((filePath) => [filePath, `${filePath}.map`])
        .map((from) => ({
          from,
          to: "[name].[ext]",
        })),
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "./assets"),
          to: "assets",
        },
      ],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: `${path.resolve(
            require.resolve("@next-core/illustrations/package.json"),
            "../dist/illustrations"
          )}`,
          to: "assets/illustrations",
        },
      ],
    }),
    new HtmlWebpackPlugin({
      title: "DevOps 管理专家",
      baseHref,
      template: path.join(__dirname, "src", "index.ejs"),
    }),
    new HtmlWebpackPlugin({
      filename: "browse-happy.html",
      title: "DevOps 管理专家",
      baseHref,
      template: path.join(__dirname, "src", "browse-happy.ejs"),
      chunks: [],
    }),
    new HtmlWebpackTagsPlugin({
      files: ["index.html"],
      scripts: [
        {
          path: brickDllJsName,
          // Always append the `dll` before any other scripts.
          append: false,
        },
      ],
    }),
    new NextHashedModuleIdsPlugin(),
    new NextDllReferencePlugin({
      context: appRoot,
      manifest: manifest,
    }),
    new webpack.DefinePlugin({
      // Ref https://webpack.js.org/plugins/define-plugin/
      // > If the value is a string it will be used as a code fragment.
      BRICK_NEXT_VERSIONS: JSON.stringify({
        ["brick-container"]: packageJson.version,
        ["brick-dll"]: brickDllVersion,
        ["brick-kit"]: brickKitVersion,
        ["brick-utils"]: brickUtilsVersion,
      }),
      BRICK_NEXT_FEATURES: JSON.stringify([
        "edit-evaluations-and-transformations-in-devtools",
      ]),
      // Recording dll js path which contains hash for long-term-caching.
      DLL_PATH: JSON.stringify(
        Object.fromEntries(dll.map(({ dllName, jsName }) => [dllName, jsName]))
      ),
    }),
  ],
};
