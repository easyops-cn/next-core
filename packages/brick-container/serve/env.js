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
    localContainer: {
      type: "boolean",
      default: true,
    },
  },
});

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
