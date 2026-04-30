const chokidar = require("chokidar");
const WebSocket = require("ws");
const { throttle } = require("lodash");
const { execSync } = require("child_process");
const chalk = require("chalk");
const { getPatternsToWatch } = require("./utils");

function killPortProcess(port) {
  try {
    const result = execSync(`lsof -ti :${port}`, { encoding: "utf-8" }).trim();
    if (result) {
      const pids = result.split("\n").filter(Boolean);
      for (const pid of pids) {
        if (String(pid) === String(process.pid)) continue;
        console.log(
          chalk.yellow("[live-reload]"),
          `Killing process ${pid} on port ${port}`
        );
        try {
          execSync(`kill -9 ${pid}`);
        } catch (_e) {
          /* ignore */
        }
      }
    }
  } catch (_e) {
    /* ignore */
  }
}

function startWss(port, callback) {
  const wss = new WebSocket.Server({ port }, () => {
    console.log(
      chalk.cyan("[live-reload]"),
      "WebSocket server listening on port",
      port
    );
    callback(wss);
  });
  wss.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(
        chalk.yellow("[live-reload]"),
        `Port ${port} in use, killing occupying process...`
      );
      killPortProcess(port);
      setTimeout(() => {
        const retry = new WebSocket.Server({ port }, () => {
          console.log(
            chalk.cyan("[live-reload]"),
            "WebSocket server listening on port",
            port
          );
          callback(retry);
        });
        retry.on("error", (e) => {
          console.error(
            chalk.red("[live-reload]"),
            "WebSocket server failed after retry:",
            e.message
          );
        });
      }, 1000);
    } else {
      console.error(
        chalk.red("[live-reload]"),
        "WebSocket server failed:",
        err.message
      );
    }
  });
}

module.exports = function liveReload(env) {
  if (env.liveReload) {
    startWss(env.wsPort, (wss) => {
      const watcher = chokidar.watch(getPatternsToWatch(env));

      const throttledOnChange = throttle(
        () => {
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send("content change");
            }
          });
        },
        100,
        { trailing: false }
      );

      watcher.on("change", throttledOnChange);
    });
  }
};
