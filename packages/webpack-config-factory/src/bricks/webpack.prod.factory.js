const TerserPlugin = require("terser-webpack-plugin");

module.exports = () => ({
  mode: "production",
  devtool: "source-map",
  output: {
    filename: "[name].[contenthash].js",
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        sourceMap: true,
        cache: true,
        parallel: true,
        terserOptions: {
          output: {
            comments: (astNode, comment) =>
              // Keep certain comments except `@contract`,
              // which will currently cause a problem of minification.
              // Invalid code generated:
              // ```js
              //   yield
              //   /**! @contract xxx */
              //   m.http.get(...)
              // ```
              // However, a valid code should be (parens are missed):
              // ```js
              //   yield(
              //   /**! @contract xxx */
              //   m.http.get(...))
              // ```
              /^\**!|@preserve|@license|@cc_on/i.test(comment.value) &&
              !/@contract/.test(comment.value),
          },
        },
        extractComments: false,
      }),
    ],
  },
});
