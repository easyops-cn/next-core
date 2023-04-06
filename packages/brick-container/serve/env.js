import meow from "meow";
import chalk from "chalk";

const cli = meow(
  `
  Usage
    $ yarn serve [options]

  Options
    --no-remote             Disable remote mode (Defaults to remote enabled)
    --server                Set remote server address, defaults to "https://dev.easyops.local"
    --subdir                Set base href to "/next/" instead of "/"
    --local-micro-apps      Specify local micro apps to be used in remote mode
    --local-container       Use local brick-container instead of remote in remote mode
    --port                  Set local server listening port, defaults to "8081"
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
      localMicroApps: {
        type: "string",
      },
      localContainer: {
        type: "boolean",
      },
      port: {
        type: "string",
        default: "8081",
      },
      verbose: {
        type: "boolean",
      },
    },
    allowUnknownFlags: false,
    autoHelp: false,
    autoVersion: false,
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

export function getEnv(rootDir, runtimeFlags) {
  const flags = {
    ...cli.flags,
    ...runtimeFlags,
  };

  const env = {
    rootDir,
    useSubdir: flags.subdir,
    useRemote: flags.remote,
    baseHref: flags.subdir ? "/next/" : "/",
    useLocalContainer: !flags.remote || flags.localContainer,
    localMicroApps: flags.localMicroApps ? flags.localMicroApps.split(",") : [],
    port: Number(flags.port),
    server: getServerPath(flags.server),
    verbose: flags.verbose,
  };

  if (env.verbose) {
    console.log("Configure:", env);
  }

  if (env.localMicroApps.length > 0) {
    console.log();
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
