const path = require("path");
const fs = require("fs");
const express = require("express");
const httpProxyMiddleware = require("http-proxy-middleware");
const { throttle } = require("lodash");
const chokidar = require("chokidar");
const chalk = require("chalk");
const getEnv = require("./getEnv");
const serveLocal = require("./serveLocal");
const getProxies = require("./getProxies");

const app = express();

const distDir = path.dirname(
  require.resolve("@easyops/brick-container/dist/index.html")
);

const env = getEnv(process.cwd());

const port = env.port;

serveLocal(env, app);

const serveIndexHtml = (_req, res) => {
  const indexHtml = path.join(distDir, "index.html");
  let content = fs.readFileSync(indexHtml, "utf8");

  // 开发环境下增加 websocket 连接的脚本
  content += `<script>
        const socket = new WebSocket('ws://localhost:' + ${env.wsPort});
        socket.onmessage = function(event) {
            if (event.data === "content change") {
                location.reload();
            }
        };
    </script>`;

  // Replace nginx ssi placeholders.
  res.send(
    content.replace(
      "<!--# echo var='base_href' default='/' -->",
      env.publicPath
    )
  );
};

// Serve index.html.
app.get(env.publicPath, serveIndexHtml);

// Serve static files.
app.use(env.publicPath, express.static(distDir));

// Using proxies.
const proxies = getProxies(env);
if (proxies) {
  for (const [path, options] of Object.entries(proxies)) {
    app.use(
      path,
      httpProxyMiddleware(
        Object.assign(
          {
            logLevel: "warn"
          },
          options
        )
      )
    );
  }
}

// All requests fallback to index.html.
app.use(serveIndexHtml);

app.listen(port);

console.log(
  chalk.bold.green("Started serving at:"),
  `http://localhost:${port}${env.publicPath}`
);

// 建立 websocket 连接支持自动刷新
const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: env.wsPort });

const watcher = chokidar.watch(
  [
    path.join(env.brickPackagesDir, "*/dist/*.js"),
    path.join(env.microAppsDir, "*/storyboard.json"),
    path.join(env.templatePackagesDir, "*/dist/*.js")
  ],
  {
    followSymlinks: true
  }
);

const throttledOnChange = throttle(
  () => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send("content change");
      }
    });
  },
  100,
  { trailing: false }
);

watcher.on("change", throttledOnChange);
