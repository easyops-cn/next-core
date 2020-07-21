const getEnv = require("../serve/getEnv");
const serveLocal = require("../serve/serveLocal");
const getProxies = require("../serve/getProxies");
const { getPatternsToWatch } = require("../serve/utils");

const env = getEnv();

// 开发时拦截 auth 及 bootstrap 相关请求。
exports.before = (app, server) => {
  // 额外监听构件库产物，以便构件库更新时触发页面刷新
  // Ref https://github.com/webpack/webpack-dev-server/issues/1271#issuecomment-379792541
  // More: https://github.com/webpack/webpack-dev-server/issues/1271#issuecomment-359817498
  getPatternsToWatch(env).forEach((file) => {
    server._watch(file);
  });

  serveLocal(env, app);
};

exports.proxy = getProxies(env);
