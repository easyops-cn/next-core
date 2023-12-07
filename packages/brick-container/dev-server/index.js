const path = require("path");
const getEnv = require("../serve/getEnv");
const serveLocal = require("../serve/serveLocal");
const getProxies = require("../serve/getProxies");
const { getPatternsToWatch } = require("../serve/utils");
const liveReload = require("../serve/liveReload");

const env = getEnv();
const devServerRef = {};
const distDir = path.join(process.cwd(), "dist");

// 开发时拦截 auth 及 bootstrap 相关请求。
exports.setupMiddlewares = (middlewares, devServer) => {
  serveLocal(env, devServer.app);
  devServerRef.current = devServer;
  return middlewares;
};

exports.watchFiles = getPatternsToWatch(env);

exports.proxy = getProxies(env, getRawIndexHtml);

async function getRawIndexHtml() {
  const indexHtmlPath = path.join(distDir, "index.html");
  try {
    return await new Promise((resolve, reject) => {
      devServerRef.current.compiler.outputFileSystem.readFile(
        indexHtmlPath,
        (err, content) => {
          if (err) {
            reject(err);
          } else {
            resolve(String(content));
          }
        }
      );
    });
  } catch (e) {
    console.error("getRawIndexHtml failed:", e);
    return "oops";
  }
}

exports.liveReload = () => {
  liveReload(env);
};
