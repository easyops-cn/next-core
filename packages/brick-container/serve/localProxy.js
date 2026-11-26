import { createProxyMiddleware } from "http-proxy-middleware";
import chalk from "chalk";
import { resolveLoginIdentity } from "./loginIdentity.js";
import { getToken } from "./tokenManager.js";

export function setupLocalProxies(app, env) {
  const config = env.localProxies;
  if (!config || !config.proxies || Object.keys(config.proxies).length === 0) {
    return;
  }

  const { proxies, auth } = config;
  const org = auth && auth.org;
  const user = auth && auth.user;
  const serverUrl = env.server;

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
      logger: {
        info() {},
        warn(...args) {
          return console.warn(...args);
        },
        error(...args) {
          return console.error(...args);
        },
      },
      pathRewrite: { [`^${fullPath}`]: "" },
      on: {
        proxyReq: (proxyReq, req) => {
          if (auth?.followLogin) {
            proxyReq.setHeader("org", String(req.localLoginIdentity.org));
            proxyReq.setHeader("user", req.localLoginIdentity.username);
            return;
          }
          if (org && !proxyReq.getHeader("org")) {
            proxyReq.setHeader("org", String(org));
          }
          if (user && !proxyReq.getHeader("user")) {
            proxyReq.setHeader("user", user);
          }
        },
      },
    });

    app.use(fullPath, async (req, res, next) => {
      console.log(
        chalk.cyan("[local-proxy]"),
        chalk.green(pathPattern) + chalk.white(":"),
        chalk.yellow(req.method),
        chalk.white(req.url)
      );
      if (auth?.followLogin) {
        try {
          req.localLoginIdentity = await resolveLoginIdentity(
            serverUrl,
            req.headers.cookie
          );
          // Never trust identity headers provided by the browser.
          req.headers.org = String(req.localLoginIdentity.org);
          req.headers.user = req.localLoginIdentity.username;
        } catch (error) {
          res.status(error.status || 502).json({
            code: error.status === 401 ? 100004 : 500,
            error: error.status === 401 ? "请先登录" : "无法验证远端登录状态",
          });
          return;
        }
      }
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
          if (auth.followLogin) {
            res.status(502).json({ error: "本地代理认证失败" });
            return;
          }
        }
      }
      proxy(req, res, next);
    });
  }
}
