module.exports = () => ({
  mode: "production",
  devtool: "source-map",
  output: {
    filename: "[name].[contenthash].js",
  },
});
