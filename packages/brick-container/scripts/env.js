import path from "node:path";
import meow from "meow";

const cli = meow({
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
    },
    localContainer: {
      type: "boolean",
      default: true,
    },
  },
});

const rootDir = path.resolve(process.cwd(), "../..");

export function getEnv(runtimeFlags) {
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
    localMicroApps: ["test", "e2e"],
    port: 8081,
    server: getServerPath(flags.server),
  };

  if (!env.useRemote) {
    env.localMicroApps.push("auth");
  }

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
