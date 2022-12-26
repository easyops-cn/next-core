// @ts-check
import path from "node:path";
import HtmlWebpackPlugin from "html-webpack-plugin";

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
  ],
};
