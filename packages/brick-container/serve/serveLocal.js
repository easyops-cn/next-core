const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const { escapeRegExp } = require("lodash");
const {
  getNavbar,
  getStoryboardsByMicroApps,
  getBrickPackages,
  getSettings,
  getTemplatePackages,
  getSingleStoryboard,
} = require("./utils");

module.exports = (env, app) => {
  const {
    useOffline,
    useRemote,
    publicPath,
    localBrickPackages,
    localEditorPackages,
    localMicroApps,
    localTemplates,
    microAppsDir,
    brickPackagesDir,
    templatePackagesDir,
    mocked,
    mockedMicroAppsDir,
    mockedMicroApps,
  } = env;
  let username;

  // 开发时默认拦截 bootstrap 请求。
  // 如果设定 `REMOTE=true`，则透传远端请求。
  if (useRemote) {
    // 设定透传远端请求时，可以指定特定的 brick packages, micro apps, template packages 使用本地文件。
    localEditorPackages.forEach((pkgId) => {
      // 直接返回本地构件库编辑器相关文件。
      app.get(`${publicPath}bricks/${pkgId}/dist/editors/*`, (req, res) => {
        const filePath = path.join(
          brickPackagesDir,
          pkgId,
          "dist-editors",
          req.params[0]
        );
        if (fs.existsSync(filePath)) {
          res.sendFile(filePath);
        } else {
          res.status(404).end();
        }
      });
    });

    localBrickPackages.forEach((pkgId) => {
      // 直接返回本地构件库相关文件（但排除编辑器相关文件）。
      app.get(
        new RegExp(
          `^${escapeRegExp(
            `${publicPath}bricks/${pkgId}/`
          )}(?!dist\\/editors\\/)(.+)`
        ),
        (req, res) => {
          const filePath = path.join(brickPackagesDir, pkgId, req.params[0]);
          if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
          } else {
            res.status(404).end();
          }
        }
      );
    });

    localMicroApps.forEach((appId) => {
      // 直接返回本地小产品相关文件。
      app.get(`${publicPath}micro-apps/${appId}/*`, (req, res) => {
        const filePath = path.join(microAppsDir, appId, req.params[0]);
        if (fs.existsSync(filePath)) {
          res.sendFile(filePath);
        } else {
          res.status(404).end();
        }
      });
    });
    localTemplates.forEach((pkgId) => {
      // 直接返回本地模板相关文件。
      app.get(`${publicPath}templates/${pkgId}/*`, (req, res) => {
        const filePath = path.join(templatePackagesDir, pkgId, req.params[0]);
        if (fs.existsSync(filePath)) {
          res.sendFile(filePath);
        } else {
          res.status(404).end();
        }
      });
    });
    mockedMicroApps.forEach((appId) => {
      // 直接返回本地小产品相关文件。
      app.get(`${publicPath}micro-apps/${appId}/*`, (req, res) => {
        const filePath = path.join(mockedMicroAppsDir, appId, req.params[0]);
        if (fs.existsSync(filePath)) {
          res.sendFile(filePath);
        } else {
          res.status(404).end();
        }
      });
      app.get(`${publicPath}api/auth/bootstrap/${appId}`, (req, res) => {
        res.json({
          code: 0,
          data: getSingleStoryboard(env, appId, true),
        });
      });
    });
    // API to fulfil the active storyboard.
    localMicroApps.concat(mockedMicroApps).forEach((appId) => {
      app.get(`${publicPath}api/auth/bootstrap/${appId}`, (req, res) => {
        res.json({
          code: 0,
          data: getSingleStoryboard(
            env,
            appId,
            mockedMicroApps.includes(appId)
          ),
        });
      });
    });
  } else {
    app.get(`${publicPath}api/auth/bootstrap`, (req, res) => {
      res.json({
        code: 0,
        data: {
          navbar: getNavbar(env),
          storyboards: (mocked
            ? getStoryboardsByMicroApps(env, true, {
                brief: req.query.brief === "true",
              })
            : []
          ).concat(
            getStoryboardsByMicroApps(env, false, {
              brief: req.query.brief === "true",
            })
          ),
          brickPackages: getBrickPackages(env),
          templatePackages: getTemplatePackages(env),
          settings: getSettings(),
        },
      });
    });

    app.get(`${publicPath}api/auth/bootstrap/:appId`, (req, res) => {
      res.json({
        code: 0,
        data: getSingleStoryboard(
          env,
          req.params.appId,
          mockedMicroApps.includes(req.params.appId)
        ),
      });
    });

    // 直接返回构件库 js 文件。
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

    // 直接返回模板库 js 文件。
    app.get(`${publicPath}templates/*`, (req, res) => {
      const filePath = path.join(templatePackagesDir, req.params[0]);
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
          org: 8888,
        },
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
            org: 8888,
          },
        });
      } else {
        res.json({
          code: 0,
          data: {
            loggedIn: false,
          },
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
