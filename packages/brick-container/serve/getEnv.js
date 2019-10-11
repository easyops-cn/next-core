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
        default: "8081"
      },
      wsPort: {
        type: "string",
        default: "8090"
      },
      server: {
        type: "string"
      }
    }
  });

  const useOffline = process.env.OFFLINE === "true" || flags.offline;
  const useSubdir = process.env.SUBDIR === "true" || flags.subdir;
  const useRemote = process.env.REMOTE === "true" || flags.remote;
  const publicPath = useSubdir ? "/next/" : "/";
  let server = process.env.SERVER || flags.server;
  if (server) {
    if (/^\d+$/.test(server)) {
      server = `http://192.168.100.${server}`;
    } else if (
      !server.startsWith("http://") &&
      !server.startsWith("https://")
    ) {
      server = `http://${server}`;
    }
  } else {
    server = "http://192.168.100.162";
  }

  const localBrickPackages = flags.localBricks
    ? flags.localBricks.split(",")
    : process.env.LOCAL_BRICKS
    ? process.env.LOCAL_BRICKS.split(",")
    : [];
  const localMicroApps = flags.localMicroApps
    ? flags.localMicroApps.split(",")
    : process.env.LOCAL_MICRO_APPS
    ? process.env.LOCAL_MICRO_APPS.split(",")
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
  const templatePackagesDir = path.join(brickNextDir, "templates");
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
    templatePackagesDir,
    navbarJsonPath,
    port: Number(flags.port),
    wsPort: Number(flags.wsPort),
    server
  };
};
