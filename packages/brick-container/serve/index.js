const path = require("path");
const fs = require("fs");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { throttle, escapeRegExp } = require("lodash");
const chokidar = require("chokidar");
const chalk = require("chalk");
const WebSocket = require("ws");
const getEnv = require("./getEnv");
const serveLocal = require("./serveLocal");
const getProxies = require("./getProxies");
const { getPatternsToWatch } = require("./utils");

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
        const socket = new WebSocket('ws://${env.host}:' + ${env.wsPort});
        socket.onmessage = function(event) {
            if (event.data === "content change") {
                location.reload();
            }
        };
    </script>`;

  // Replace nginx ssi placeholders.
  res.send(
    content.replace(
      new RegExp(
        escapeRegExp("<!--# echo var='base_href' default='/' -->"),
        "g"
      ),
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
      createProxyMiddleware(
        Object.assign(
          {
            logLevel: "warn",
          },
          options
        )
      )
    );
  }

  if (env.useSubdir) {
    app.all(
      /^(?!\/next\/).+/,
      createProxyMiddleware({
        target: env.consoleServer,
        secure: false,
        changeOrigin: true,
        logLevel: "warn",
      })
    );
  }
}

// All requests fallback to index.html.
app.use(serveIndexHtml);

app.listen(port, env.host);

console.log(
  chalk.bold.green("Started serving at:"),
  `http://${env.host}:${port}${env.publicPath}`
);

// 建立 websocket 连接支持自动刷新
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
