const buildMicroApps = require("./buildMicroApps");

module.exports = scope => {
  if (scope === "micro-apps") {
    buildMicroApps();
  }
};
