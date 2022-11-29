const path = require("path");
const fs = require("fs");
const https = require("https");
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
const { getPatternsToWatch } = require("./utils");
const { getIndexHtml, distDir } = require("./getIndexHtml");

module.exports = function serve(runtimeFlags) {
  const env = getEnv(runtimeFlags);

  const app = express();

  serveLocal(env, app);

  const serveIndexHtmlFactory = (standaloneConfig) => (_req, res) => {
    res.send(getIndexHtml(standaloneConfig, env));
  };

  if (!env.useRemote) {
    let fakeAuthHandled = false;
    for (const standaloneConfig of env.legacyStandaloneAppsConfig) {
      // Return a fake `conf.yaml` for standalone micro-apps.
      app.get(`${standaloneConfig.appRoot}conf.yaml`, (req, res) => {
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
      if (!fakeAuthHandled && standaloneConfig.appDir) {
        fakeAuthHandled = true;
        app.get(`${env.baseHref}auth/login`, (req, res) => {
          res.send("Developing Login");
        });
      }
    }
  }

  if (env.useLocalContainer) {
    const browseHappyHtml = "browse-happy.html";
    for (const standaloneConfig of env.legacyAllAppsConfig) {
      const serveRoot = `${env.baseHref}${
        standaloneConfig ? standaloneConfig.appDir : ""
      }`;
      if (env.asCdn) {
        app.get(serveRoot, (req, res) => {
          res.sendStatus(404);
        });
        app.get(`${env.baseHref}${browseHappyHtml}`, (req, res) => {
          res.sendStatus(404);
        });
      } else {
        // Serve index.html.
        app.get(serveRoot, serveIndexHtmlFactory(standaloneConfig, env));

        // Serve browse-happy.html.
        app.get(`${env.baseHref}${browseHappyHtml}`, (req, res) => {
          res.sendFile(path.join(distDir, browseHappyHtml));
        });
      }

      // Serve static files.
      const staticRoot = standaloneConfig
        ? `${standaloneConfig.appRoot || serveRoot}-/core/`
        : serveRoot;
      app.use(staticRoot, express.static(distDir));
    }

    // Serve static files in next-core for new standalone apps.
    app.use(`${env.saStaticRoot}-/core/:coreVersion/`, express.static(distDir));
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

    if (env.useSubdir && !env.asCdn) {
      app.get(
        "/",
        createProxyMiddleware({
          target: env.server,
          secure: false,
          changeOrigin: true,
          onProxyRes(proxyRes, req) {
            if (
              req.path === "/" &&
              proxyRes.statusCode >= 301 &&
              proxyRes.statusCode <= 303
            ) {
              const rawLocation = proxyRes.headers["location"] || "";
              const expectLocation = ["http:", "https:"]
                .map((scheme) => env.server.replace(/^https?:/, scheme))
                .flatMap((url) => [`${url}/next`, `${url}/next/`]);
              if (expectLocation.some((loc) => rawLocation === loc)) {
                proxyRes.headers["location"] = env.baseHref;
                console.log('Root redirection intercepted: "%s"', rawLocation);
              }
            }
          },
        })
      );

      if (env.legacyConsole) {
        app.all(
          new RegExp(`^(?!${escapeRegExp(env.baseHref)}).+`),
          createProxyMiddleware({
            target: env.consoleServer,
            secure: false,
            changeOrigin: true,
            logLevel: "warn",
          })
        );
      }
    }
  }

  if (env.useLocalContainer && !env.asCdn) {
    for (const standaloneConfig of env.legacyAllAppsConfig) {
      const serveRoot = `${env.baseHref}${
        standaloneConfig ? standaloneConfig.appDir : ""
      }`;
      app.use(serveRoot, serveIndexHtmlFactory(standaloneConfig, env));
    }

    // Return a fake 404 page for not-existed apps.
    app.use(env.baseHref, (req, res) => {
      res.send(
        `<basic-bricks.page-not-found>${env.baseHref.replace(/\/$/, "")}${
          req.path
        } is not found</basic-bricks.page-not-found>`
      );
    });
  }

  if (env.https) {
    const server = https.createServer(
      {
        key: fs.readFileSync(path.join(env.rootDir, "dev-https.key"), "utf8"),
        cert: fs.readFileSync(path.join(env.rootDir, "dev-https.cert"), "utf8"),
      },
      app
    );
    server.listen(env.port, env.host);
  } else {
    app.listen(env.port, env.host);
  }

  console.log(
    chalk.bold.green("Started serving at:"),
    `http${env.https ? "s" : ""}://${env.host}:${env.port}${env.baseHref}`
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
