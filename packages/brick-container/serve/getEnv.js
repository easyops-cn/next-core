const fs = require("fs");
const path = require("path");
const meow = require("meow");
const chalk = require("chalk");
const {
  getNamesOfMicroApps,
  getNamesOfBrickPackages,
  getNamesOfTemplatePackages,
} = require("./utils");

function getServerPath(server) {
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

  return server;
}

module.exports = (cwd) => {
  let flags = {};
  if (cwd) {
    flags = meow(
      `
      Usage
        $ yarn serve [options]

      Options
        --auto-remote       Use auto remote mode (use all local existed packages, combined with remote packages)
        --remote            Use remote mode (use all remote packages except those specified by \`--local-*\`)
        --server            Set remote server address, defaults to "192.168.100.162"
        --console-server    Set remote console server address, defaults to remote server address
        --subdir            Set base href to "/next/" instead of "/"
        --local-bricks      Specify local brick packages to be used in remote mode
        --local-micro-apps  Specify local micro apps to be used in remote mode
        --local-templates   Specify local template packages to be used in remote mode
        --local-settings    Use local settings instead of remote settings in remote mode
        --merge-settings    Merge remote settings by local settings in remote mode
        --port              Set local server listening port, defaults to "8081"
        --ws-port           Set local WebSocket server listening port, defaults to "8090"
        --host              Set local server listening host, defaults to "localhost"
        --offline           Use offline mode
        --verbose           Print verbose logs
        --mock              Enable mock-micro-apps
    `,
      {
        flags: {
          offline: {
            type: "boolean",
          },
          subdir: {
            type: "boolean",
          },
          remote: {
            type: "boolean",
          },
          autoRemote: {
            type: "boolean",
          },
          localBricks: {
            type: "string",
          },
          localMicroApps: {
            type: "string",
          },
          localTemplates: {
            type: "string",
          },
          localSettings: {
            type: "boolean",
          },
          mergeSettings: {
            type: "boolean",
          },
          host: {
            type: "string",
            default: "localhost",
          },
          port: {
            type: "string",
            default: "8081",
          },
          wsPort: {
            type: "string",
            default: "8090",
          },
          server: {
            type: "string",
          },
          consoleServer: {
            type: "string",
          },
          verbose: {
            type: "boolean",
          },
          mock: {
            type: "boolean",
          },
        },
      }
    ).flags;
  }

  const useOffline = flags.offline || process.env.OFFLINE === "true";
  const useSubdir = flags.subdir || process.env.SUBDIR === "true";
  const useRemote = flags.remote || process.env.REMOTE === "true";
  const useAutoRemote = flags.autoRemote || process.env.AUTO_REMOTE === "true";
  const publicPath = useSubdir ? "/next/" : "/";
  const server = getServerPath(flags.server || process.env.SERVER);
  let consoleServer = flags.consoleServer || process.env.CONSOLE_SERVER;
  consoleServer = consoleServer ? getServerPath(consoleServer) : server;

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

  const rootDir = path.join(__dirname, "../../..");
  const contextDir = cwd || rootDir;
  const useLocalSettings =
    flags.localSettings || process.env.LOCAL_SETTINGS === "true";
  const useMergeSettings =
    flags.mergeSettings || process.env.MERGE_SETTINGS === "true";

  function getBrickNextDir() {
    if (cwd) {
      return cwd;
    }
    const devConfig = getDevConfig();
    if (devConfig && devConfig.brickNextDir) {
      return devConfig.brickNextDir;
    }
    return path.join(rootDir, "../brick-next");
  }

  function getDevConfig() {
    const devConfigJsPath = path.join(contextDir, "dev.config.js");
    if (fs.existsSync(devConfigJsPath)) {
      return require(devConfigJsPath);
    }
  }

  function getAppConfig() {
    const devConfig = getDevConfig();
    if (devConfig) {
      return devConfig.appConfig || {};
    }
    return {};
  }

  const brickNextDir = getBrickNextDir();
  const microAppsDir = path.join(brickNextDir, "node_modules/@micro-apps");
  const brickPackagesDir = path.join(brickNextDir, "node_modules/@bricks");
  const templatePackagesDir = path.join(
    brickNextDir,
    "node_modules/@templates"
  );
  const navbarJsonPath = path.join(__dirname, "../conf/navbar.json");
  const appConfig = getAppConfig();
  const mockedMicroAppsDir = path.join(brickNextDir, "mock-micro-apps");

  const env = {
    useOffline,
    useSubdir,
    useRemote,
    useAutoRemote,
    publicPath,
    localBrickPackages,
    localMicroApps,
    localTemplates,
    useLocalSettings,
    useMergeSettings,
    brickNextDir,
    microAppsDir,
    brickPackagesDir,
    templatePackagesDir,
    navbarJsonPath,
    host: flags.host,
    port: Number(flags.port),
    wsPort: Number(flags.wsPort),
    server,
    consoleServer,
    appConfig,
    verbose: flags.verbose || process.env.VERBOSE === "true",
    mocked: flags.mock || process.env.MOCK === "true",
    mockedMicroAppsDir,
  };

  if (useAutoRemote) {
    env.useRemote = true;
    env.localBrickPackages = getNamesOfBrickPackages(env).concat(
      env.localBrickPackages
    );
    env.localMicroApps = getNamesOfMicroApps(env).concat(env.localMicroApps);
    env.localTemplates = getNamesOfTemplatePackages(env).concat(
      env.localTemplates
    );
  }

  env.mockedMicroApps = env.mocked ? getNamesOfMicroApps(env, true) : [];

  if (env.verbose) {
    console.log("Configure:", env);
  }

  if (env.mockedMicroApps.length > 0) {
    console.log();
    console.log("mocked micro-apps:", env.mockedMicroApps);
  }

  if (env.localMicroApps.length > 0) {
    console.log();
    console.log("local micro-apps:", env.localMicroApps);
  }

  if (env.localBrickPackages.length > 0) {
    console.log();
    console.log("local bricks:", env.localBrickPackages);
  }

  if (env.localTemplates.length > 0) {
    console.log();
    console.log("local templates:", env.localTemplates);
  }

  console.log();
  console.log(
    chalk.bold.cyan("mode:"),
    env.useAutoRemote
      ? chalk.bgYellow("auto-remote")
      : env.useRemote
      ? chalk.bgCyan("remote")
      : chalk.bgWhite("local")
  );

  return env;
};
