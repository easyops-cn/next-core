const baseFactory = require("./webpack.base.factory");

module.exports = {
  webpackCommonFactory: baseFactory(),
  webpackEditorsFactory: baseFactory({
    isForEditors: true,
  }),
  webpackPropertyEditorFactory: baseFactory({
    isForPropertyEditors: true,
  }),
  webpackDevFactory: require("./webpack.dev.factory"),
  webpackProdFactory: require("./webpack.prod.factory"),
  webpackContractsFactory: require("./webpack.contracts.factory"),
};
