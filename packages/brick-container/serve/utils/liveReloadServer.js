import path from "node:path";
import WebSocket, { WebSocketServer } from "ws";
import { watch } from "chokidar";
import _ from "lodash";

export default function liveReloadServer(env) {
  if (env.liveReload) {
    const wss = new WebSocketServer({ port: env.wsPort });
    const watcher = watch(
      env.localMicroApps.map((appId) =>
        path.join(env.rootDir, "mock-micro-apps", appId, "storyboard.yaml")
      )
    );

    const throttledOnChange = _.throttle(
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
}
