const { LessReplacer } = require("./LessReplacer");

exports.lessReplacePlugin = {
  install: (less, pluginManager) => {
    pluginManager.addPreProcessor(new LessReplacer(), 2000);
  },
  minVersion: [2, 7, 1],
};
