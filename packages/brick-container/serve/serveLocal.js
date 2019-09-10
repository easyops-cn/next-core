const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const {
  getNavbar,
  getStoryboardsByMicroApps,
  getBrickPackages,
  getSettings
} = require("./utils");

module.exports = (env, app) => {
  const {
    useOffline,
    useRemote,
    publicPath,
    localBrickPackages,
    localMicroApps,
    microAppsDir,
    brickPackagesDir
  } = env;
  let username;

  // 开发时默认拦截 bootstrap 请求。
  // 如果设定 `REMOTE=true`，则透传远端请求。
  if (useRemote) {
    // 设定透传远端请求时，可以指定特定的 brick packages 和 micro apps 使用本地文件。
    if (localBrickPackages.length > 0) {
      localBrickPackages.map(pkgId => {
        // 直接返回插件 js 文件。
        app.get(`${publicPath}bricks/${pkgId}/*`, (req, res) => {
          const filePath = path.join(brickPackagesDir, pkgId, req.params[0]);
          if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
          } else {
            res.status(404).end();
          }
        });
      });
    }
    if (localMicroApps.length > 0) {
      localMicroApps.map(appId => {
        // 直接返回小产品相关文件。
        app.get(`${publicPath}micro-apps/${appId}/*`, (req, res) => {
          const filePath = path.join(microAppsDir, appId, req.params[0]);
          if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
          } else {
            res.status(404).end();
          }
        });
      });
    }
  } else {
    app.get(`${publicPath}api/auth/bootstrap`, (req, res) => {
      res.json({
        code: 0,
        data: {
          navbar: getNavbar(env),
          storyboards: getStoryboardsByMicroApps(env),
          brickPackages: getBrickPackages(env),
          settings: getSettings()
        }
      });
    });

    // 直接返回插件 js 文件。
    app.get(`${publicPath}bricks/*`, (req, res) => {
      const filePath = path.join(brickPackagesDir, req.params[0]);
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        res.status(404).end();
      }
    });

    // 直接返回小产品相关文件。
    app.get(`${publicPath}micro-apps/*`, (req, res) => {
      const filePath = path.join(microAppsDir, req.params[0]);
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        res.status(404).end();
      }
    });
  }

  if (useOffline) {
    // 离线开发模式下，mock API 请求

    // 校验登录。
    app.get(`${publicPath}api/auth/login`, (req, res) => {
      res.json({
        code: 0,
        data: {
          loggedIn: !!username,
          username,
          org: 8888
        }
      });
    });

    // 执行登录。
    app.post(`${publicPath}api/auth/login`, bodyParser.json(), (req, res) => {
      if (req.body.username === "easyops" && req.body.password === "easyops") {
        username = req.body.username;
        res.json({
          code: 0,
          data: {
            loggedIn: true,
            username,
            org: 8888
          }
        });
      } else {
        res.json({
          code: 0,
          data: {
            loggedIn: false
          }
        });
      }
    });

    // 执行登出。
    app.post(`${publicPath}api/auth/logout`, (req, res) => {
      username = undefined;
      res.json({ code: 0 });
    });
  }
};
