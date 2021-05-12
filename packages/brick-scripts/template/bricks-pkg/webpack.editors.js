const { bricks, merge } = require("@next-core/webpack-config-factory");

const { webpackEditorsFactory, webpackDevFactory, webpackProdFactory } = bricks;

module.exports = merge(
  webpackEditorsFactory(),
  process.env.NODE_ENV === "development"
    ? webpackDevFactory()
    : webpackProdFactory()
);
