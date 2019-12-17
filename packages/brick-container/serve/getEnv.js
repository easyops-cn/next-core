const fs = require("fs");
const path = require("path");
const meow = require("meow");
const {
  getNamesOfMicroApps,
  getNamesOfBrickPackages,
  getNamesOfTemplatePackages
} = require("./utils");

module.exports = cwd => {
  let flags = {};
  if (cwd) {
    flags = meow(
      `
      Usage
        $ yarn serve [options]

      Options
        --auto-remote       Use auto remote mode (use all local existed packages, combined with remote packages)
        --remote            Use remote mode (use all remote packages except those specified by \`--local-*\`)
        --server            Set server address, defaults to "192.168.100.162"
        --subdir            Set base href to "/next/" instead of "/"
        --local-bricks      Specify local brick packages to be used in remote mode
        --local-micro-apps  Specify local micro apps to be used in remote mode
        --local-templates   Specify local brick packages to be used in remote mode
        --port              Set local server port, defaults to "8081"
        --ws-port           Set local WebSocket server port, defaults to "8090"
        --offline           Use offline mode
    `,
      {
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
          autoRemote: {
            type: "boolean"
          },
          localBricks: {
            type: "string"
          },
          localMicroApps: {
            type: "string"
          },
          localTemplates: {
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
      }
    ).flags;
  }

  const useOffline = process.env.OFFLINE === "true" || flags.offline;
  const useSubdir = process.env.SUBDIR === "true" || flags.subdir;
  const useRemote = process.env.REMOTE === "true" || flags.remote;
  const useAutoRemote = process.env.AUTO_REMOTE === "true" || flags.autoRemote;
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
  const localTemplates = flags.localTemplates
    ? flags.localTemplates.split(",")
    : process.env.LOCAL_TEMPLATES
    ? process.env.LOCAL_TEMPLATES.split(",")
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

  const env = {
    useOffline,
    useSubdir,
    useRemote,
    useAutoRemote,
    publicPath,
    localBrickPackages,
    localMicroApps,
    localTemplates,
    brickNextDir,
    microAppsDir,
    brickPackagesDir,
    templatePackagesDir,
    navbarJsonPath,
    port: Number(flags.port),
    wsPort: Number(flags.wsPort),
    server
  };

  if (useAutoRemote) {
    env.useRemote = true;
    env.localBrickPackages = getNamesOfBrickPackages(env);
    env.localMicroApps = getNamesOfMicroApps(env);
    env.localTemplates = getNamesOfTemplatePackages(env);
  }

  return env;
};
