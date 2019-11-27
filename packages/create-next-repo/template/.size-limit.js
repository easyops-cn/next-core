const { sizeLimit } = require("@easyops/build-config-factory");

module.exports = sizeLimit({
  bricks: {
    "*": "50 KB"
  },
  templates: {
    "*": "5 KB"
  }
});
