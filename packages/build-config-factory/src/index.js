module.exports = {
  build: require("./build"),
  preBuild: require("./pre-build"),
  postBuild: require("./post-build"),
  sizeLimit: require("./size-limit"),
  createVersionFile: require("./generateVersionFile"),
  renameTarPackage: require("./rename-tar-package")
};
