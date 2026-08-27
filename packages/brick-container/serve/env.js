import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import meow from "meow";
import chalk from "chalk";
import glob from "glob";
import yaml from "js-yaml";
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
    --host                  Set local server listening host, defaults to "localhost"
    --port                  Set local server listening port, defaults to "8081"
    --ws-port               Set local WebSocket server listening port, defaults to "8090"
    --live-reload           Enable live reload (currently only for local micro-apps)
    --size-check            Enable size-check mode
    --cookie-same-site-none Append "Same-Site: none" for cookies
    --https                 Enable serving by https (auto-generates self-signed cert if missing)
    --verbose               Print verbose logs
    --proxy-config          Specify custom proxy config file path (defaults to "dev.proxy.yaml" in project root)
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
      sizeCheck: {
        type: "boolean",
      },
      https: {
        type: "boolean",
      },
      verbose: {
        type: "boolean",
      },
      proxyConfig: {
        type: "string",
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
  let https;
  let sizeCheckFilter;
  if (existsSync(devConfigMjs)) {
    const {pathToFileURL} = await import("url");
    const devConfig = (await import(pathToFileURL(devConfigMjs).href)).default;
    if (devConfig) {
      if (Array.isArray(devConfig.brickFolders)) {
        brickFolders = devConfig.brickFolders;
        configuredBrickFolders = true;
      }
      localSettings = devConfig.settings;
      localMocks = devConfig.mocks;
      userConfigByApps = devConfig.userConfigByApps;
      https = devConfig.https;
      sizeCheckFilter = devConfig.sizeCheckFilter;
    }
  }

  if (!https && flags.https) {
    const keyPath = path.join(rootDir, "dev-https.key");
    const certPath = path.join(rootDir, "dev-https.cert");

    if (!existsSync(keyPath) || !existsSync(certPath)) {
      const { execSync } = await import("node:child_process");
      const san = `DNS:localhost${flags.host !== "localhost" ? ",IP:" + flags.host : ""}`;
      console.log(chalk.cyan("Auto-generating self-signed certificate..."));
      execSync(
        `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=localhost" -addext "subjectAltName=${san}"`,
        { stdio: "inherit" }
      );
    }

    https = {
      key: readFileSync(keyPath, "utf8"),
      cert: readFileSync(certPath, "utf8"),
    };
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
              glob(normalizeGlobPattern(path.resolve(rootDir, folder)), {}, (err, matches) => {
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
    https,
    host: flags.host,
    port: Number(flags.port),
    wsPort: Number(flags.wsPort),
    server: getServerPath(flags.server),
    sizeCheck: flags.sizeCheck,
    sizeCheckFilter,
    verbose: flags.verbose,
    localProxies: getLocalProxies(rootDir, flags.proxyConfig),
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

  if (
    env.localProxies.proxies &&
    Object.keys(env.localProxies.proxies).length > 0
  ) {
    console.log();
    console.log("local proxies:", env.localProxies.proxies);
    if (env.localProxies.auth) {
      console.log(
        "local proxy auth: clientId=%s, org=%s, user=%s",
        env.localProxies.auth.clientId,
        env.localProxies.auth.org,
        env.localProxies.auth.user
      );
    }
  }

  return env;
}

function getLocalProxies(rootDir, customPath) {
  const proxyConfigPath = customPath
    ? path.resolve(customPath)
    : path.join(rootDir, "dev.proxy.yaml");
  if (existsSync(proxyConfigPath)) {
    console.log(chalk.cyan("proxy config:"), proxyConfigPath);
    const content = yaml.load(readFileSync(proxyConfigPath, "utf8"));
    if (!content) return {};
    if (content.proxies) {
      return content;
    }
    return { proxies: content };
  }
  if (customPath) {
    console.error(chalk.red("proxy config not found:"), proxyConfigPath);
  }
  return {};
}

function getServerPath(server) {
  if (server) {
    if (!server.startsWith("http://") && !server.startsWith("https://")) {
      server = `http://${server}`;
    }
  } else {
    server = "https://dev.easyops.local";
  }

  return new URL(server).origin;
}

function normalizeGlobPattern(filePath) {
  return filePath.split(path.win32.sep).join(path.posix.sep);
}
