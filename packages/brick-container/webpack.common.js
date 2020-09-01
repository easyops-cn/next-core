const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const manifest = require("@easyops/brick-dll");
const packageJson = require("./package.json");
const brickDllVersion = require("@easyops/brick-dll/package.json").version;
const brickKitVersion = require("@easyops/brick-kit/package.json").version;
const brickUtilsVersion = require("@easyops/brick-utils/package.json").version;

const appRoot = path.join(__dirname, "..", "..");
let baseHref = "/";
if (process.env.SUBDIR === "true") {
  baseHref = "/next/";
} else if (process.env.NODE_ENV === "production") {
  baseHref = "<!--# echo var='base_href' default='/' -->";
}

// Find all `@dll/*`.
const dll = Object.keys(packageJson.devDependencies)
  .filter((name) => name.startsWith("@dll/"))
  .map((name) => {
    const baseName = name.split("/").slice(-1)[0];
    return {
      baseName,
      filePath: `${name}/dist/dll-of-${baseName}.js`,
    };
  });

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
        .map(({ filePath }) => filePath)
        .concat("@easyops/brick-dll/dist/dll.js")
        .map((filePath) => require.resolve(filePath))
        .map((filePath) => [filePath, `${filePath}.map`])
        .reduce((acc, item) => acc.concat(item), []),
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "./assets"),
          to: "assets",
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
    new webpack.HashedModuleIdsPlugin(),
    new webpack.DllReferencePlugin({
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
      // Recording dll hash for long-term-caching.
      DLL_HASH: JSON.stringify(
        dll.reduce((acc, { baseName, filePath }) => {
          const content = fs.readFileSync(require.resolve(filePath), {
            encoding: "utf8",
          });
          const hash = crypto
            .createHash("sha1")
            .update(content, "utf8")
            .digest("hex")
            .substring(0, 8);
          acc[baseName] = hash;
          return acc;
        }, {})
      ),
    }),
  ],
};
