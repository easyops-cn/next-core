module.exports = {
  build: require("./build"),
  preBuild: require("./pre-build"),
  postBuild: require("./post-build"),
  sizeLimit: require("./size-limit"),
  createVersionFiles: require("./generateVersionFile")
};
