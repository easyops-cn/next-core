const baseFactory = require("./webpack.base.factory");

module.exports = {
  webpackCommonFactory: baseFactory(),
  webpackEditorsFactory: baseFactory(true),
  webpackDevFactory: require("./webpack.dev.factory"),
  webpackProdFactory: require("./webpack.prod.factory"),
};
