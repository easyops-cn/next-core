const path = require("path");
const fs = require("fs");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { throttle, escapeRegExp } = require("lodash");
const chokidar = require("chokidar");
const chalk = require("chalk");
const WebSocket = require("ws");
const yaml = require("js-yaml");
const getEnv = require("./getEnv");
const serveLocal = require("./serveLocal");
const getProxies = require("./getProxies");
const { getPatternsToWatch, appendLiveReloadScript } = require("./utils");

module.exports = function serve(runtimeFlags) {
  const env = getEnv(runtimeFlags);

  const app = express();

  const distDir = path.dirname(
    require.resolve(
      `@next-core/brick-container/${
        env.standaloneMicroApps ? "dist-standalone" : "dist"
      }/index.html`
    )
  );

  serveLocal(env, app);

  let cachedIndexHtml;

  const serveIndexHtml = (_req, res) => {
    if (!cachedIndexHtml) {
      const indexHtml = path.join(distDir, "index.html");
      let content = fs.readFileSync(indexHtml, "utf8");

      if (env.liveReload) {
        content = appendLiveReloadScript(content, env);
      }

      content = content.replace(
        new RegExp(
          escapeRegExp("<!--# echo var='base_href' default='/' -->"),
          "g"
        ),
        env.baseHref
      );

      if (env.standaloneMicroApps) {
        content = content
          .replace(
            new RegExp(escapeRegExp("<!--# echo var='app_dir' -->"), "g"),
            env.standaloneAppDir
          )
          .replace(
            "</head>",
            [
              "<script>",
              "((w)=>{",
              [
                `var t=${JSON.stringify(env.standaloneAppDir)}`,
                "w.STANDALONE_MICRO_APPS=true",
                `var p=w.PUBLIC_ROOT=t+"-/"`,
                'w.CORE_ROOT=p+"core/"',
                `w.BOOTSTRAP_FILE=p+"bootstrap.hash.json"`,
              ]
                .filter(Boolean)
                .join(";"),
              "})(window)",
              "</script></head>",
            ].join("")
          );
      }

      cachedIndexHtml = content;
    }

    // Replace nginx ssi placeholders.
    res.send(cachedIndexHtml);
  };

  if (env.standaloneMicroApps) {
    // Return a fake `conf.yaml` for standalone micro-apps.
    app.get(`${env.baseHref}conf.yaml`, (req, res) => {
      res.setHeader("content-type", "text/plain");
      res.send(
        yaml.safeDump({
          sys_settings: {
            feature_flags: {
              "development-mode": true,
            },
          },
        })
      );
    });

    // Return a fake page of `/auth/*` for fully standalone micro-apps.
    if (env.standaloneAppDir) {
      app.get(`${env.baseHref}auth/login`, (req, res) => {
        res.send("Developing Login");
      });
    }
  }

  const serveRoot = env.standaloneMicroApps
    ? `${env.baseHref}${env.standaloneAppDir}`
    : env.baseHref;

  if (env.useLocalContainer) {
    // Serve index.html.
    app.get(serveRoot, serveIndexHtml);
    // Serve static files.
    app.use(serveRoot, express.static(distDir));
  }

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

  if (env.useLocalContainer) {
    app.use(serveRoot, serveIndexHtml);

    if (env.standaloneAppDir) {
      // Return a fake 404 page for path other than current app.
      app.use(env.baseHref, (req, res) => {
        res.send(
          `<basic-bricks.page-not-found>${env.baseHref.replace(/\/$/, "")}${
            req.path
          } is not found</basic-bricks.page-not-found>`
        );
      });
    }
  }

  app.listen(env.port, env.host);

  console.log(
    chalk.bold.green("Started serving at:"),
    `http://${env.host}:${env.port}${env.baseHref}`
  );

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
