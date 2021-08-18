module.exports = () => ({
  mode: "development",
  devtool: "source-map",
  output: {
    filename: "[name].bundle.js",
  },
  optimization: {
    // Use named module ids to avoid conflicts with modules bundled in production mode.
    moduleIds: "named",
  },
});
