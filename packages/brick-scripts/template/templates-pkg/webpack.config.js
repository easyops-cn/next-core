const { bricks, merge } = require("@next-core/webpack-config-factory");

const { webpackCommonFactory, webpackDevFactory, webpackProdFactory } = bricks;

module.exports = merge(
  webpackCommonFactory({
    scope: "templates",
  }),
  process.env.NODE_ENV === "development"
    ? webpackDevFactory()
    : webpackProdFactory()
);
