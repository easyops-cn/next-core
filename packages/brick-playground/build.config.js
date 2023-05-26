// @ts-check
import path from "node:path";
import { createRequire } from "node:module";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";

const require = createRequire(import.meta.url);

const packageDir = process.cwd();

/** @type {import("@next-core/build-next-bricks").BuildNextBricksConfig} */
export default {
  type: "brick-playground",
  extractCss: true,
  moduleFederationShared: false,
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: path.join(packageDir, "src/index.ejs"),
    }),
    new MonacoWebpackPlugin({
      languages: ["javascript", "typescript", "html", "css" /* , "yaml" */],
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
    new CopyPlugin({
      patterns: [
        {
          from: path.join(
            require.resolve("@next-core/preview/package.json"),
            "../dist"
          ),
          to: "preview",
        },
      ],
    }),
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
          name: "vendors",
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
