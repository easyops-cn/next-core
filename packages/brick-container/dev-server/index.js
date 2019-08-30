const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const meow = require("meow");
const yaml = require("js-yaml");
const modifyResponse = require("./modifyResponse");

const { flags } = meow({
  flags: {
    offline: {
      type: "boolean"
    },
    subdir: {
      type: "boolean"
    },
    remote: {
      type: "boolean"
    },
    localBricks: {
      type: "string"
    },
    localMicroApps: {
      type: "string"
    }
  }
});

const useOffline = process.env.OFFLINE === "true" || flags.offline;
const useSubdir = process.env.SUBDIR === "true" || flags.subdir;
const useRemote = flags.remote;

const publicPath = useSubdir ? "/next/" : "/";
let username;

const localBrickPackages = flags.localBricks
  ? flags.localBricks.split(",")
  : [];
const localMicroApps = flags.localMicroApps
  ? flags.localMicroApps.split(",")
  : [];

const brickNextRootDir = path.join(__dirname, "../../../../brick-next");
const microAppsDir = path.join(brickNextRootDir, "micro-apps");
const brickPackagesDir = path.join(brickNextRootDir, "bricks");

function getNavbar() {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "../conf/navbar.json"), "utf8")
  );
}

function getStoryboardsByMicroApps() {
  return fs
    .readdirSync(microAppsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .map(getSingleStoryboard)
    .filter(Boolean);
}

function getSingleStoryboard(microAppName) {
  const storyboardJsonFile = path.join(
    microAppsDir,
    microAppName,
    "storyboard.json"
  );
  return fs.existsSync(storyboardJsonFile)
    ? JSON.parse(fs.readFileSync(storyboardJsonFile, "utf8"))
    : undefined;
}

function getBrickPackages() {
  return fs
    .readdirSync(brickPackagesDir)
    .map(getSingleBrickPackage)
    .filter(Boolean);
}

function getSingleBrickPackage(brickPackageName) {
  const distDir = path.join(brickPackagesDir, brickPackageName, "dist");
  if (fs.existsSync(distDir)) {
    let filePath, bricksJson;
    for (const file of fs.readdirSync(distDir)) {
      if (file.endsWith(".js")) {
        filePath = `bricks/${brickPackageName}/dist/${file}`;
      } else if (file === "bricks.json") {
        bricksJson = JSON.parse(
          fs.readFileSync(path.join(distDir, "bricks.json"), "utf8")
        );
      }
    }
    if (bricksJson && filePath) {
      return {
        ...bricksJson,
        filePath
      };
    }
  }
}

function getSettings() {
  const defaultSettings = {
    featureFlags: {},
    homepage: "/"
  };
  const yamlPath = path.join(__dirname, "settings.yaml");
  if (!fs.existsSync(yamlPath)) {
    return defaultSettings;
  }
  const userSettings = yaml.safeLoad(fs.readFileSync(yamlPath), "utf8");
  const { feature_flags: featureFlags, homepage } = userSettings;
  Object.assign(defaultSettings.featureFlags, featureFlags);
  Object.assign(defaultSettings, { homepage });
  return defaultSettings;
}

// 开发时拦截 auth 及 bootstrap 相关请求。
exports.before = (app, server) => {
  // 额外监听构件库产物，以便构件库更新时触发页面刷新
  // Ref https://github.com/webpack/webpack-dev-server/issues/1271#issuecomment-379792541
  // More: https://github.com/webpack/webpack-dev-server/issues/1271#issuecomment-359817498
  server._watch(path.join(brickPackagesDir, "*/dist/*.js"));
  // 额外监听 storyboard 文件，以便修改时触发页面刷新
  server._watch(path.join(microAppsDir, "*/storyboard.json"));

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
          navbar: getNavbar(),
          storyboards: getStoryboardsByMicroApps(),
          brickPackages: getBrickPackages(),
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

const pathRewriteFactory = seg =>
  useSubdir
    ? {
        [`^${publicPath}${seg}`]: `/${seg}`
      }
    : undefined;

const proxyPaths = ["api"];
const otherProxyOptions = {};
if (useRemote) {
  proxyPaths.push("bricks", "micro-apps");
  if (localBrickPackages.length > 0 || localMicroApps.length > 0) {
    otherProxyOptions.onProxyRes = (proxyRes, req, res) => {
      // 设定透传远端请求时，可以指定特定的 brick packages 和 micro apps 使用本地文件。
      if (req.path === "/api/auth/bootstrap") {
        modifyResponse(res, proxyRes, raw => {
          const result = JSON.parse(raw);
          const { data } = result;
          if (localMicroApps.length > 0) {
            data.storyboards = data.storyboards
              .map(item => {
                if (item.app && localMicroApps.includes(item.app.id)) {
                  return getSingleStoryboard(item.app.id);
                }
                return item;
              })
              .filter(Boolean);
          }
          if (localBrickPackages.length > 0) {
            data.brickPackages = data.brickPackages.map(item => {
              const id = item.filePath.split("/")[1];
              if (localBrickPackages.includes(id)) {
                return getSingleBrickPackage(id);
              }
              return item;
            });
          }
          return JSON.stringify(result);
        });
      }
    };
  }
}

exports.proxy = useOffline
  ? undefined
  : proxyPaths.reduce((acc, seg) => {
      acc[`${publicPath}${seg}`] = {
        target: "http://brick-next.162.d.easyops.local",
        changeOrigin: true,
        pathRewrite: pathRewriteFactory(seg),
        headers: {
          "dev-only-login-page": `http://localhost:8081${publicPath}auth/login`
        },
        ...otherProxyOptions
      };
      return acc;
    }, {});
