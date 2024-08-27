// @ts-check
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";
import _ from "lodash";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const originalFilePath = path.resolve(
  require.resolve("monaco-editor/package.json"),
  "../esm/vs/editor/common/services/findSectionHeaders.js"
);

const packageDir = process.cwd();

/** @type {import("@next-core/build-next-bricks").BuildNextBricksConfig} */
export default {
  type: "brick-playground",
  extractCss: true,
  moduleFederationShared: false,
  moduleRules: [
    {
      // This file contains static initialization blocks which are not supported until Chrome 94
      test: /[\\/]node_modules[\\/]monaco-editor[\\/]esm[\\/]vs[\\/]language[\\/]typescript[\\/]tsMode\.js$/,
      loader: "babel-loader",
      options: {
        rootMode: "upward",
      },
    },
  ],
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: path.join(packageDir, "src/index.ejs"),
    }),
    new MonacoWebpackPlugin({
      languages: ["javascript", "typescript", "css" /* , "html", "yaml" */],
      features: [
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
    new webpack.NormalModuleReplacementPlugin(
      new RegExp(`^${_.escapeRegExp(originalFilePath)}$`),
      // Refactor without 'd' flag of RegExp
      path.resolve(__dirname, "src/replaces/findSectionHeaders.js")
    ),
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
