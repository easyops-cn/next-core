const { merge } = require("webpack-merge");
const common = require("./webpack/common.js");
const dev = require("./webpack/dev.js");

module.exports = merge(common(), dev());
