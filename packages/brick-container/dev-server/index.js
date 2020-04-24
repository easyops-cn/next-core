const path = require("path");
const getEnv = require("../serve/getEnv");
const serveLocal = require("../serve/serveLocal");
const getProxies = require("../serve/getProxies");

const env = getEnv();

// 开发时拦截 auth 及 bootstrap 相关请求。
exports.before = (app, server) => {
  // 额外监听构件库产物，以便构件库更新时触发页面刷新
  // Ref https://github.com/webpack/webpack-dev-server/issues/1271#issuecomment-379792541
  // More: https://github.com/webpack/webpack-dev-server/issues/1271#issuecomment-359817498
  server._watch(path.join(env.brickPackagesDir, "*/dist/*.js"));
  // 额外监听模板库产物
  server._watch(path.join(env.templatePackagesDir, "*/dist/*.js"));
  // 额外监听 storyboard 文件
  server._watch(path.join(env.microAppsDir, "*/storyboard.json"));

  // 额外监听 mocked storyboard 文件
  if (env.mocked) {
    server._watch(path.join(env.mockedMicroAppsDir, "*/storyboard.json"));
  }

  serveLocal(env, app);
};

exports.proxy = getProxies(env);
