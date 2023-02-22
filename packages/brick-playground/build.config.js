// @ts-check
import path from "node:path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";

const packageDir = process.cwd();

/** @type {import("@next-core/build-next-bricks").BuildNextBricksConfig} */
export default {
  type: "brick-playground",
  entry: {
    main: "./src/index",
    preview: "./src/preview",
  },
  extractCss: true,
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: path.join(packageDir, "src/index.ejs"),
      excludeChunks: ["preview"],
    }),
    new HtmlWebpackPlugin({
      filename: "preview.html",
      template: path.join(packageDir, "src/preview.ejs"),
      chunks: ["preview"],
    }),
    new MonacoWebpackPlugin({
      languages: ["javascript", "typescript", "html", "css", "yaml"],
      features: [
        "!accessibilityHelp",
        "!codelens",
        "!colorPicker",
        "!documentSymbols",
        "!fontZoom",
        "!iPadShowKeyboard",
        "!inspectTokens",
      ],
      filename: `workers/[name].${
        process.env.NODE_ENV === "development" ? "bundle" : "[contenthash:8]"
      }.worker.js`,
    }),
  ],
  optimization: {
    minimize: false,
    splitChunks: {
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
          name: "vendors",
        },
        core: {
          test: /[\\/]next-core[\\/]packages[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
          name: "core",
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
};
