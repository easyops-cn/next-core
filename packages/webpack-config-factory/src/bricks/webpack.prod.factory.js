module.exports = () => ({
  mode: "production",
  devtool: "source-map",
  output: {
    filename: "index.[contenthash].js"
  }
});
