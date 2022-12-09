const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

const packageDir = process.cwd();

module.exports = {
  type: "container",
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      title: "DevOps 管理专家",
      template: path.join(packageDir, "src/index.ejs"),
      baseHref: "/",
    }),
  ],
};
