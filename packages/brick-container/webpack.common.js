const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const manifest = require("@easyops/brick-dll");
const packageJson = require("./package.json");

const appRoot = path.join(__dirname, "..", "..");
let baseHref = "/";
if (process.env.SUBDIR === "true") {
  baseHref = "/next/";
} else if (process.env.NODE_ENV === "production") {
  baseHref = "<!--# echo var='base_href' default='/' -->";
}

// Find all `@dll/*`.
const dll = Object.keys(packageJson.devDependencies)
  .filter(name => name.startsWith("@dll/"))
  .map(name => {
    const baseName = name.split("/").slice(-1)[0];
    return {
      baseName,
      filePath: `${name}/dist/dll-of-${baseName}.js`
    };
  });

module.exports = {
  context: appRoot,
  entry: {
    polyfill: path.join(__dirname, "src", "polyfill"),
    main: path.join(__dirname, "src", "index")
  },
  output: {
    path: path.join(__dirname, "dist")
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    symlinks: false
  },
  module: {
    rules: [
      {
        // Include ts, tsx, js, and jsx files.
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        options: {
          rootMode: "upward"
        }
      }
    ]
  },
  plugins: [
    new CopyPlugin(dll.map(({ filePath }) => require.resolve(filePath))),
    new CopyPlugin([
      {
        from: path.resolve(__dirname, "./assets"),
        to: "assets",
        ignore: [".*"]
      }
    ]),
    new HtmlWebpackPlugin({
      title: "DevOps 管理专家",
      baseHref,
      template: path.join(__dirname, "src", "index.ejs")
    }),
    new webpack.HashedModuleIdsPlugin(),
    new webpack.DllReferencePlugin({
      context: appRoot,
      manifest: manifest
    }),
    new webpack.DefinePlugin({
      // Recording dll hash for long-term cache.
      DLL_HASH: JSON.stringify(
        dll.reduce((acc, { baseName, filePath }) => {
          const content = fs.readFileSync(require.resolve(filePath), {
            encoding: "utf8"
          });
          const hash = crypto
            .createHash("sha1")
            .update(content, "utf8")
            .digest("hex")
            .substring(0, 8);
          acc[baseName] = hash;
          return acc;
        }, {})
      )
    })
  ]
};
