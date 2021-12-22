const getEnv = require("../serve/getEnv");
const serveLocal = require("../serve/serveLocal");
const getProxies = require("../serve/getProxies");
const { getPatternsToWatch } = require("../serve/utils");

const env = getEnv();

// 开发时拦截 auth 及 bootstrap 相关请求。
exports.setupMiddlewares = (middlewares, devServer) => {
  serveLocal(env, devServer.app);
};

exports.watchFiles = getPatternsToWatch(env);

exports.proxy = getProxies(env);
