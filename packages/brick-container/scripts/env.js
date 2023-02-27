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
    useLocalContainer: true,
    localMicroApps: ["auth", "test"],
    port: 8081,
    server: getServerPath(flags.server),
  };

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
