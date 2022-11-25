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
      console.warn(
        chalk.yellow(
          "Warning: using a single part of IP is deprecated, and will be removed soon!"
        )
      );
      server = `http://192.168.100.${server}`;
    } else if (
      !server.startsWith("http://") &&
      !server.startsWith("https://")
    ) {
      server = `http://${server}`;
    }
  } else {
    server = "https://dev.easyops.local";
  }

  return server;
}

module.exports = (runtimeFlags) => {
  let flags = {};
  const isWebpackServe = process.env.WEBPACK_SERVE === "true";
  if (!isWebpackServe) {
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
      localSnippets: {
        type: "string",
      },
      localMicroApps: {
        type: "string",
      },
      localTemplates: {
        type: "string",
      },
      darkThemeApps: {
        type: "string",
      },
      localContainer: {
        type: "boolean",
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
      https: {
        type: "boolean",
        default: false,
      },
      cookieSameSiteNone: {
        type: "boolean",
        default: true,
      },
      server: {
        type: "string",
      },
      legacyConsole: {
        type: "boolean",
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
      // <!-- Options for standalone micro-apps started.
      standaloneMicroApps: {
        type: "boolean",
      },
      standaloneAppDir: {
        type: "string",
        default: "",
      },
      standaloneAppRoot: {
        type: "string",
      },
      bootstrapHash: {
        type: "string",
        default: "hash",
      },
      setSubdir: {
        type: "string",
      },
      // --> Options for standalone micro-apps ended.
      legacyBootstrap: {
        type: "boolean",
      },
      mockDate: {
        type: "string",
      },
      publicCdn: {
        type: "string",
      },
      asCdn: {
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
        --auto-remote           Use auto remote mode (use all local existed packages, combined with remote packages)
        --no-remote             Disable remote mode (Defaults to remote enabled)
        --server                Set remote server address, defaults to "https://dev.easyops.local"
        --console-server        Set remote console server address, defaults to remote server address
        --subdir                Set base href to "/next/" instead of "/"
        --local-bricks          Specify local brick packages to be used in remote mode
        --legacy-bootstrap      Use legacy bootstrap provider
        --local-editors         Specify local editor packages to be used in remote mode
        --local-snippets        Specify local snippet packages to be used in remote mode
        --local-micro-apps      Specify local micro apps to be used in remote mode
        --local-templates       Specify local template packages to be used in remote mode
        --local-container       Use local brick-container instead of remote in remote mode
        --local-settings        Use local settings instead of remote settings in remote mode
        --no-merge-settings     Disable merge remote settings by local settings in remote mode
        --port                  Set local server listening port, defaults to "8081"
        --ws-port               Set local WebSocket server listening port, defaults to "8090"
        --host                  Set local server listening host, defaults to "localhost"
        --offline               Use offline mode
        --verbose               Print verbose logs
        --no-mock               Disable mock-micro-apps
        --dark-theme-apps       Specify local micro apps to be used in dark theme
        --no-live-reload        Disable live reload through WebSocket (for E2E tests in CI)
        --https                 Enable serving by https
        --cookie-same-site-none Enable serving by https
        --mock-date             Setting mock date (for sandbox demo website only)
        --public-cdn            Setting public cdn site
        --as-cdn                Serve as cdn site
        --legacy-console        Enable legacy console proxy
        --help                  Show help message
        --version               Show brick container version
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

    flags = {
      ...cli.flags,
      ...runtimeFlags,
    };
  }

  const _standalone = flags.standalone || process.env.STANDALONE === "true";

  const rootDir = process.env.INIT_CWD.endsWith("/packages/brick-container")
    ? path.join(process.env.INIT_CWD, "../..")
    : process.env.INIT_CWD;

  function getDevConfig() {
    const devConfigJsPath = path.join(rootDir, "dev.config.js");
    if (fs.existsSync(devConfigJsPath)) {
      return require(devConfigJsPath);
    }
  }

  const devConfig = getDevConfig();
  const nextRepoDir = (devConfig && devConfig.nextRepoDir) || rootDir;
  const standaloneAppsConfig =
    (devConfig && devConfig.standaloneAppsConfig) || [];
  for (const standaloneConfig of standaloneAppsConfig) {
    if (!standaloneConfig.standaloneVersion) {
      standaloneConfig.standaloneVersion = 2;
    }
  }
  const appConfig = (devConfig && devConfig.appConfig) || {};

  const { usePublicScope, standalone: confStandalone } =
    getEasyopsConfig(nextRepoDir);

  const standalone = confStandalone || _standalone;

  const useOffline = flags.offline || process.env.OFFLINE === "true";
  const useSubdir =
    flags.subdir ||
    !!flags.setSubdir ||
    process.env.SUBDIR === "true" ||
    !!process.env.SET_SUBDIR;
  const useRemote =
    flags.remote === undefined
      ? process.env.NO_REMOTE !== "true"
      : flags.remote;
  const useAutoRemote = flags.autoRemote || process.env.AUTO_REMOTE === "true";
  const useLegacyBootstrap =
    flags.legacyBootstrap || process.env.LEGACY_BOOTSTRAP === "true";
  const baseHref = flags.setSubdir
    ? `/${flags.setSubdir.replace(/^\/|\/$/, "")}/`
    : useSubdir
    ? "/next/"
    : "/";
  const server = getServerPath(flags.server || process.env.SERVER);
  let consoleServer = flags.consoleServer || process.env.CONSOLE_SERVER;
  const legacyConsole =
    consoleServer || flags.legacyConsole || process.env.LEGACY_CONSOLE;
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
  const localSnippetPackages = flags.localSnippets
    ? flags.localSnippets.split(",")
    : process.env.LOCAL_SNIPPETS
    ? process.env.LOCAL_SNIPPETS.split(",")
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

  const useDarkThemeApps = flags.darkThemeApps
    ? flags.darkThemeApps.split(",")
    : process.env.DARK_THEME_APPS
    ? process.env.DARK_THEME_APPS.split(",")
    : [];

  const useLocalSettings =
    flags.localSettings || process.env.LOCAL_SETTINGS === "true";
  const useMergeSettings =
    flags.mergeSettings === undefined
      ? process.env.NO_MERGE_SETTINGS !== "true"
      : flags.mergeSettings;

  const microAppsDir = path.join(
    nextRepoDir,
    `node_modules/${usePublicScope ? "@next-micro-apps" : "@micro-apps"}`
  );
  const alternativeMicroAppsDir = path.join(nextRepoDir, "micro-apps");

  const brickPackagesDir = path.join(
    nextRepoDir,
    `node_modules/${usePublicScope ? "@next-bricks" : "@bricks"}`
  );
  const alternativeBrickPackagesDir = path.join(
    nextRepoDir,
    `node_modules/${usePublicScope ? "@bricks" : "@next-bricks"}`
  );
  const primitiveBrickPackagesDir = path.join(nextRepoDir, "bricks");

  const templatePackagesDir = path.join(
    nextRepoDir,
    `node_modules/${usePublicScope ? "@next-legacy-templates" : "@templates"}`
  );
  const alternativeTemplatePackagesDir = path.join(nextRepoDir, "templates");

  const navbarJsonPath = path.join(__dirname, "../conf/navbar.json");
  const mockedMicroAppsDir = path.join(nextRepoDir, "mock-micro-apps");

  if (flags.standaloneMicroApps) {
    standaloneAppsConfig.push({
      appDir: flags.standaloneAppDir,
      appRoot:
        flags.standaloneAppRoot || `${baseHref}${flags.standaloneAppDir}`,
      bootstrapHash: flags.bootstrapHash,
    });
  }

  const env = {
    rootDir,
    standalone,
    useOffline,
    useSubdir,
    useRemote,
    useAutoRemote,
    useLegacyBootstrap,
    baseHref,
    localBrickPackages,
    localEditorPackages,
    localSnippetPackages,
    localMicroApps,
    localTemplates,
    useDarkThemeApps,
    useLocalSettings,
    useMergeSettings,
    nextRepoDir,
    microAppsDir,
    alternativeMicroAppsDir,
    brickPackagesDir,
    alternativeBrickPackagesDir,
    primitiveBrickPackagesDir,
    templatePackagesDir,
    alternativeTemplatePackagesDir,
    navbarJsonPath,
    hasStandaloneApps: standaloneAppsConfig.length > 0,
    standaloneAppsConfig,
    allAppsConfig: standaloneAppsConfig.concat(null),
    bootstrapHash: flags.bootstrapHash,
    host: flags.host,
    port: Number(flags.port),
    wsPort: Number(flags.wsPort),
    https: flags.https,
    cookieSameSiteNone: flags.cookieSameSiteNone,
    server,
    legacyConsole,
    consoleServer,
    appConfig,
    verbose: flags.verbose || process.env.VERBOSE === "true",
    mocked: flags.mock === undefined ? process.env.MOCK === "true" : flags.mock,
    mockedMicroAppsDir,
    liveReload: flags.asCdn
      ? false
      : flags.liveReload === undefined
      ? process.env.NO_LIVE_RELOAD !== "true"
      : flags.liveReload,
    mockDate: flags.mockDate,
    publicCdn: flags.publicCdn,
    asCdn: flags.asCdn,
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

  env.useLocalContainer =
    standalone || isWebpackServe || !env.useRemote || flags.localContainer;

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

  if (env.localSnippetPackages.length > 0) {
    console.log();
    console.log("local snippets:", env.localSnippetPackages);
  }

  if (env.localTemplates.length > 0) {
    console.log();
    console.log("local templates:", env.localTemplates);
  }

  console.log();
  console.log(
    chalk.bold.cyan("mode:"),
    env.hasStandaloneApps
      ? chalk.bgCyanBright("standalone-micro-apps")
      : env.standalone
      ? chalk.bgBlueBright("standalone")
      : env.useAutoRemote
      ? chalk.bgYellow("auto-remote")
      : env.useRemote
      ? chalk.bgCyan("remote")
      : chalk.bgWhite("local")
  );

  if (env.hasStandaloneApps) {
    console.log(chalk.bold.cyan("standalone apps:"), env.standaloneAppsConfig);
  }

  console.log(
    chalk.bold.cyan("container:"),
    env.useLocalContainer ? chalk.bgWhite("local") : chalk.bgCyan("remote")
  );

  console.log(
    chalk.bold.cyan("live-reload:"),
    env.liveReload ? chalk.bgGreen("enabled") : chalk.bgGrey("disabled")
  );

  console.log(
    chalk.bold.cyan("remote:"),
    env.useRemote || !env.useLocalContainer ? server : "N/A"
  );

  if (env.publicCdn) {
    console.log(chalk.bold.cyan("public-cdn:"), env.publicCdn);
  }

  if (env.asCdn) {
    console.log(chalk.bold.yellow("as-cdn: true"));
  }

  return env;
};
