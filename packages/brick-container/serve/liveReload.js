const chokidar = require("chokidar");
const WebSocket = require("ws");
const { throttle } = require("lodash");
const { getPatternsToWatch } = require("./utils");

module.exports = function liveReload(env) {
  // 建立 websocket 连接支持自动刷新
  if (env.liveReload) {
    const wss = new WebSocket.Server({ port: env.wsPort });

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
  }
};
