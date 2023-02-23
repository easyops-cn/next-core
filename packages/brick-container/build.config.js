// @ts-check
import path from "node:path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";

const packageDir = process.cwd();

/** @type {import("@next-core/build-next-bricks").BuildNextBricksConfig} */
export default {
  type: "container",
  entry: {
    main: "./src/index",
    polyfill: "./src/polyfill",
  },
  extractCss: true,
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      title: "DevOps 管理专家",
      template: path.join(packageDir, "src/index.ejs"),
      baseHref: "/",
      // favicon: path.join(packageDir, "assets/favicon.png"),
      faviconPath: "assets/favicon.png",
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.join(packageDir, "assets"),
          to: "assets",
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
