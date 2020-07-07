const { bricks, merge } = require("@easyops/webpack-config-factory");

const { webpackCommonFactory, webpackDevFactory, webpackProdFactory } = bricks;

module.exports = merge(
  webpackCommonFactory(),
  process.env.NODE_ENV === "development"
    ? webpackDevFactory()
    : webpackProdFactory()
);
