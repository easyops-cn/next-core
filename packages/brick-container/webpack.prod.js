const { merge } = require("webpack-merge");
const common = require("./webpack/common.js");
const prod = require("./webpack/prod.js");

module.exports = [
  merge(common(), prod()),
  merge(common({ standalone: true }), prod({ standalone: true })),
];
