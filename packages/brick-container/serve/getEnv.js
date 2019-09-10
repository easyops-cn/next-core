const fs = require("fs");
const path = require("path");
const meow = require("meow");

module.exports = cwd => {
  const { flags } = meow({
    flags: {
      offline: {
        type: "boolean"
      },
      subdir: {
        type: "boolean"
      },
      remote: {
        type: "boolean"
      },
      localBricks: {
        type: "string"
      },
      localMicroApps: {
        type: "string"
      },
      port: {
        type: "string",
        default: "8083"
      }
    }
  });

  const useOffline = process.env.OFFLINE === "true" || flags.offline;
  const useSubdir = process.env.SUBDIR === "true" || flags.subdir;
  const useRemote = flags.remote;
  const publicPath = useSubdir ? "/next/" : "/";

  const localBrickPackages = flags.localBricks
    ? flags.localBricks.split(",")
    : [];
  const localMicroApps = flags.localMicroApps
    ? flags.localMicroApps.split(",")
    : [];

  function getBrickNextDir() {
    if (cwd) {
      return cwd;
    }
    const rootDir = path.join(__dirname, "../../..");
    const devConfigJs = path.join(rootDir, "dev.config.js");
    if (fs.existsSync(devConfigJs)) {
      return require(devConfigJs).brickNextDir;
    }
    return path.join(rootDir, "../brick-next");
  }

  const brickNextDir = getBrickNextDir();
  const microAppsDir = path.join(brickNextDir, "micro-apps");
  const brickPackagesDir = path.join(brickNextDir, "bricks");
  const navbarJsonPath = path.join(__dirname, "../conf/navbar.json");

  return {
    useOffline,
    useSubdir,
    useRemote,
    publicPath,
    localBrickPackages,
    localMicroApps,
    brickNextDir,
    microAppsDir,
    brickPackagesDir,
    navbarJsonPath,
    port: Number(flags.port)
  };
};
