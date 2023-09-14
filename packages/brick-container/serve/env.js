import { existsSync } from "node:fs";
import path from "node:path";
import meow from "meow";
import chalk from "chalk";
import glob from "glob";
import { getLocalBrickPackageNames } from "@next-core/serve-helpers";
import { getSizeCheckApp } from "./utils/sizeCheck.js";

const cli = meow(
  `
  Usage
    $ yarn serve [options]

  Options
    --no-remote             Disable remote mode (Defaults to remote enabled)
    --server                Set remote server address, defaults to "https://dev.easyops.local"
    --subdir                Set base href to "/next/" instead of "/"
    --local-bricks          Specify local brick packages to be used, defaults to use all local ones
    --local-micro-apps      Specify local micro apps to be used
    --local-container       Use local brick-container instead of remote in remote mode
    --port                  Set local server listening port, defaults to "8081"
    --ws-port               Set local WebSocket server listening port, defaults to "8090"
    --live-reload           Enable live reload (currently only for local micro-apps)
    --size-check            Enable size-check mode
    --cookie-same-site-none Append "Same-Site: none" for cookies
    --verbose               Print verbose logs
    --help                  Show help message
    --version               Show brick container version
  `,
  {
    importMeta: import.meta,
    flags: {
      subdir: {
        type: "boolean",
      },
      server: {
        type: "string",
      },
      remote: {
        type: "boolean",
        default: true,
      },
      localBricks: {
        type: "string",
      },
      localMicroApps: {
        type: "string",
      },
      localContainer: {
        type: "boolean",
      },
      cookieSameSiteNone: {
        type: "boolean",
        default: true,
      },
      liveReload: {
        type: "boolean",
      },
      port: {
        type: "string",
        default: "8081",
      },
      wsPort: {
        type: "string",
        default: "8090",
      },
      sizeCheck: {
        type: "boolean",
      },
      verbose: {
        type: "boolean",
      },
    },
    allowUnknownFlags: false,
  }
);

if (cli.input.length > 0) {
  console.error(chalk.red("Unexpected args received"));
  // `process.exit(exitCode)` will be called in `cli.showHelp()`.
  cli.showHelp();
}

if (cli.flags.help) {
  cli.showHelp(0);
}

if (cli.flags.version) {
  cli.showVersion();
}

export async function getEnv(rootDir, runtimeFlags) {
  const flags = {
    ...cli.flags,
    ...runtimeFlags,
  };

  let localSettings, localMocks;

  let brickFolders = ["node_modules/@next-bricks", "node_modules/@bricks"];
  const devConfigMjs = path.join(rootDir, "dev.config.mjs");
  let configuredBrickFolders = false;
  let userConfigByApps;
  if (existsSync(devConfigMjs)) {
    const devConfig = (await import(devConfigMjs)).default;
    if (devConfig) {
      if (Array.isArray(devConfig.brickFolders)) {
        brickFolders = devConfig.brickFolders;
        configuredBrickFolders = true;
      }
      localSettings = devConfig.settings;
      localMocks = devConfig.mocks;
      userConfigByApps = devConfig.userConfigByApps;
    }
  }

  const env = {
    rootDir,
    useSubdir: flags.subdir,
    useRemote: flags.remote,
    baseHref: flags.subdir ? "/next/" : "/",
    useLocalContainer: !flags.remote || flags.localContainer,
    localBricks: flags.localBricks ? flags.localBricks.split(",") : undefined,
    localMicroApps: flags.localMicroApps ? flags.localMicroApps.split(",") : [],
    localBrickFolders: (
      await Promise.all(
        brickFolders.map(
          (folder) =>
            new Promise((resolve, reject) => {
              glob(path.resolve(rootDir, folder), {}, (err, matches) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(matches);
                }
              });
            })
        )
      )
    ).flat(),
    cookieSameSiteNone: flags.cookieSameSiteNone,
    liveReload: flags.liveReload,
    localSettings,
    userConfigByApps,
    port: Number(flags.port),
    wsPort: Number(flags.wsPort),
    server: getServerPath(flags.server),
    sizeCheck: flags.sizeCheck,
    verbose: flags.verbose,
  };

  env.localMocks = localMocks?.map((mock) => ({
    path: env.baseHref,
    middleware: mock,
  }));

  if (env.sizeCheck) {
    env.localMicroApps.push(getSizeCheckApp().id);
  }

  if (env.verbose) {
    console.log("Configure:", env);
  }

  if (configuredBrickFolders) {
    console.log("local brick folders:", env.localBrickFolders);
  }

  if (localSettings) {
    console.log("local settings: enabled");
  }

  const configuredApps = Object.keys(userConfigByApps ?? {});
  if (configuredApps.length) {
    console.log(`Override user config for apps: ${configuredApps.join(", ")}`);
  }

  if (localMocks?.length) {
    console.log("local mock: enabled");
  }

  if (env.liveReload) {
    console.log("live-reload: enabled");
  }

  const validLocalBricks = await getLocalBrickPackageNames(
    env.localBrickFolders,
    env.localBricks
  );

  console.log("local brick packages:", validLocalBricks);

  if (env.localMicroApps.length > 0) {
    console.log("local micro-apps:", env.localMicroApps);
  }

  console.log();
  console.log(
    chalk.bold.cyan("mode:"),
    env.useRemote ? chalk.bgCyan("remote") : chalk.bgWhite("local")
  );

  console.log(
    chalk.bold.cyan("container:"),
    env.useLocalContainer ? chalk.bgWhite("local") : chalk.bgCyan("remote")
  );

  console.log(
    chalk.bold.cyan("remote:"),
    env.useRemote || !env.useLocalContainer ? env.server : "N/A"
  );

  return env;
}

function getServerPath(server) {
  if (server) {
    if (!server.startsWith("http://") && !server.startsWith("https://")) {
      server = `http://${server}`;
    }
  } else {
    server = "https://dev.easyops.local";
  }

  return server;
}
