const { lessReplacePlugin } = require("@next-core/less-plugin-css-variables");
const devServerOptions = require("./dev-server");

const servePublicPath = process.env.SUBDIR === "true" ? "/next/" : "/";

module.exports = () => ({
  mode: "development",
  devtool: "source-map",
  output: {
    filename: "[name].js",
  },
  devServer: {
    host: "localhost",
    port: 8081,
    devMiddleware: {
      publicPath: servePublicPath,
    },
    open: [servePublicPath],
    hot: true,
    historyApiFallback: {
      // Paths with dots should still use the history fallback.
      // Ref https://github.com/facebook/create-react-app/issues/387.
      disableDotRule: true,
      // Ref https://github.com/webpack/webpack-dev-server/issues/216#issuecomment-309436276
      index: servePublicPath,
    },
    ...devServerOptions,
  },
  module: {
    rules: [
      {
        test: /\.less$/,
        sideEffects: true,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                sourceMap: true,
                javascriptEnabled: true,
                plugins: [lessReplacePlugin],
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        sideEffects: true,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
});
