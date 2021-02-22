const fs = require("fs");
const path = require("path");
const meow = require("meow");
const chalk = require("chalk");
const { getEasyopsConfig } = require("@next-core/repo-config");
const {
  getNamesOfMicroApps,
  getNamesOfBrickPackages,
  getNamesOfTemplatePackages,
  checkLocalPackages,
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

// When start webpack-dev-server for brick-container,
// the `cwd` is empty.
module.exports = (cwd) => {
  let flags = {};
  if (cwd) {
    const flagOptions = {
      offline: {
        type: "boolean",
      },
      subdir: {
        type: "boolean",
      },
      remote: {
        type: "boolean",
        default: true,
      },
      autoRemote: {
        type: "boolean",
      },
      localBricks: {
        type: "string",
      },
      localEditors: {
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
        default: true,
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
        default: true,
      },
      liveReload: {
        type: "boolean",
        default: true,
      },
      standalone: {
        type: "boolean",
      },
      // Todo(steve): remove `help` and `version` after meow fixed it.
      help: {
        type: "boolean",
      },
      version: {
        type: "boolean",
      },
    };
    const cli = meow(
      `
      Usage
        $ yarn serve [options]

      Options
        --auto-remote       Use auto remote mode (use all local existed packages, combined with remote packages)
        --no-remote         Disable remote mode (Defaults to remote enabled)
        --server            Set remote server address, defaults to "192.168.100.162"
        --console-server    Set remote console server address, defaults to remote server address
        --subdir            Set base href to "/next/" instead of "/"
        --local-bricks      Specify local brick packages to be used in remote mode
        --local-editors     Specify local editor packages to be used in remote mode
        --local-micro-apps  Specify local micro apps to be used in remote mode
        --local-templates   Specify local template packages to be used in remote mode
        --local-settings    Use local settings instead of remote settings in remote mode
        --no-merge-settings Disable merge remote settings by local settings in remote mode
        --port              Set local server listening port, defaults to "8081"
        --ws-port           Set local WebSocket server listening port, defaults to "8090"
        --host              Set local server listening host, defaults to "localhost"
        --offline           Use offline mode
        --verbose           Print verbose logs
        --no-mock           Disable mock-micro-apps
        --no-live-reload    Disable live reload through WebSocket (for E2E tests in CI)
        --help              Show help message
        --version           Show brick container version
      `,
      {
        flags: flagOptions,
        allowUnknownFlags: false,
      }
    );

    if (cli.input.length > 0) {
      console.error(chalk.red("Unexpected args received"));
      // `process.exit(2)` will be called in `cli.showHelp()`.
      cli.showHelp();
    }

    flags = cli.flags;
  }

  const { usePublicScope, standalone: confStandalone } = getEasyopsConfig();

  const standalone = confStandalone || flags.standalone;

  const useOffline = flags.offline || process.env.OFFLINE === "true";
  const useSubdir = flags.subdir || process.env.SUBDIR === "true";
  const useRemote =
    flags.remote === undefined
      ? process.env.NO_REMOTE !== "true"
      : flags.remote;
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
  const localEditorPackages = flags.localEditors
    ? flags.localEditors.split(",")
    : process.env.LOCAL_EDITORS
    ? process.env.LOCAL_EDITORS.split(",")
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
    flags.mergeSettings === undefined
      ? process.env.NO_MERGE_SETTINGS !== "true"
      : flags.mergeSettings;

  function getBrickNextDir() {
    if (cwd) {
      return cwd;
    }
    const devConfig = getDevConfig();
    if (devConfig && devConfig.nextRepoDir) {
      return devConfig.nextRepoDir;
    }
    return path.join(rootDir, "../next-basics");
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

  const nextRepoDir = getBrickNextDir();
  const microAppsDir = path.join(
    nextRepoDir,
    `node_modules/${usePublicScope ? "@next-micro-apps" : "@micro-apps"}`
  );
  const brickPackagesDir = path.join(
    nextRepoDir,
    `node_modules/${usePublicScope ? "@next-bricks" : "@bricks"}`
  );
  const templatePackagesDir = path.join(
    nextRepoDir,
    `node_modules/${usePublicScope ? "@next-legacy-templates" : "@templates"}`
  );
  const navbarJsonPath = path.join(__dirname, "../conf/navbar.json");
  const appConfig = getAppConfig();
  const mockedMicroAppsDir = path.join(nextRepoDir, "mock-micro-apps");

  const env = {
    standalone,
    useOffline,
    useSubdir,
    useRemote,
    useAutoRemote,
    publicPath,
    localBrickPackages,
    localEditorPackages,
    localMicroApps,
    localTemplates,
    useLocalSettings,
    useMergeSettings,
    nextRepoDir,
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
    mocked:
      flags.mock === undefined ? process.env.NO_MOCK !== "true" : flags.mock,
    mockedMicroAppsDir,
    liveReload:
      flags.liveReload === undefined
        ? process.env.NO_LIVE_RELOAD !== "true"
        : flags.liveReload,
  };

  checkLocalPackages(env);

  if (standalone) {
    env.useOffline = true;
    env.useRemote = false;
    env.useAutoRemote = false;
  }

  if (useAutoRemote) {
    env.useRemote = true;
    env.localEditorPackages = getNamesOfBrickPackages(env).concat(
      env.localEditorPackages
    );
  }

  if (useAutoRemote || standalone) {
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

  if (env.localEditorPackages.length > 0) {
    console.log();
    console.log("local editors:", env.localEditorPackages);
  }

  if (env.localTemplates.length > 0) {
    console.log();
    console.log("local templates:", env.localTemplates);
  }

  console.log();
  console.log(
    chalk.bold.cyan("mode:"),
    env.standalone
      ? chalk.bgBlueBright("standalone")
      : env.useAutoRemote
      ? chalk.bgYellow("auto-remote")
      : env.useRemote
      ? chalk.bgCyan("remote")
      : chalk.bgWhite("local")
  );

  console.log(
    chalk.bold.cyan("live-reload:"),
    env.liveReload ? chalk.bgGreen("enabled") : chalk.bgGrey("disabled")
  );

  return env;
};
