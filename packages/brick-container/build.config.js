import path from "node:path";
import HtmlWebpackPlugin from "html-webpack-plugin";

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
    }),
  ],
};
