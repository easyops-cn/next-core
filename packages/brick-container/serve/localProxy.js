const { createProxyMiddleware } = require("http-proxy-middleware");
const chalk = require("chalk");
const { getToken } = require("./tokenManager");

function setupLocalProxies(app, env) {
  const config = env.localProxies;
  if (!config || !config.proxies || Object.keys(config.proxies).length === 0) {
    return;
  }

  const { proxies, auth } = config;
  const org = auth && auth.org;
  const user = auth && auth.user;
  const serverUrl = env.server;

  // 预热 token，避免首次请求 401
  if (auth && !auth.token) {
    getToken(serverUrl, auth).catch((e) =>
      console.error(
        chalk.red("[local-proxy]"),
        "Token pre-warm failed:",
        e.message
      )
    );
  }

  for (const [pathPattern, target] of Object.entries(proxies)) {
    const gatewayPath = pathPattern.startsWith("/")
      ? pathPattern
      : `/api/gateway/${pathPattern}`;
    const fullPath = `${env.baseHref}${gatewayPath.slice(1)}`;

    const proxy = createProxyMiddleware({
      target,
      secure: false,
      changeOrigin: true,
      logLevel: "debug",
      pathRewrite: { [`^${fullPath}`]: "" },
      onProxyReq: (proxyReq) => {
        if (org && !proxyReq.getHeader("org")) {
          proxyReq.setHeader("org", String(org));
        }
        if (user && !proxyReq.getHeader("user")) {
          proxyReq.setHeader("user", user);
        }
      },
    });

    app.use(fullPath, async (req, res, next) => {
      console.log(
        chalk.cyan("[local-proxy]"),
        chalk.green(pathPattern) + chalk.white(":"),
        chalk.yellow(req.method),
        chalk.white(req.url)
      );
      if (auth) {
        try {
          const token = await getToken(serverUrl, auth);
          if (token) {
            req.headers["authorization"] = `Bearer ${token}`;
          }
        } catch (e) {
          console.error(
            chalk.red("[local-proxy]"),
            "Failed to get token:",
            e.message
          );
        }
      }
      proxy(req, res, next);
    });
  }
}

module.exports = { setupLocalProxies };
