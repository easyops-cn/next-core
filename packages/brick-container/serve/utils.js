const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const chalk = require("chalk");
const { omit } = require("lodash");

function getNavbar(env) {
  return JSON.parse(fs.readFileSync(env.navbarJsonPath, "utf8"));
}

function getStoryboardsByMicroApps(env, mocked, options = {}) {
  return getNamesOfMicroApps(env, mocked)
    .map((name) => getSingleStoryboard(env, name, mocked, options))
    .filter(Boolean);
}

function getNamesOfMicroApps(env, mocked) {
  const dir = mocked
    ? env.mockedMicroAppsDir
    : tryFiles([
        path.resolve(env.microAppsDir),
        path.resolve(env.alternativeMicroAppsDir),
      ]);
  if (!fs.existsSync(dir)) {
    return [];
  }
  const apps = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() || dirent.isSymbolicLink())
    .map((dirent) => dirent.name);
  // Ignore `auth` for fully standalone micro-apps.
  return mocked &&
    env.standaloneAppsConfig.some((standaloneConfig) => standaloneConfig.appDir)
    ? apps.filter((name) => name !== "auth")
    : apps;
}

function getSingleStoryboard(env, microAppName, mocked, options = {}) {
  const appDir = path.join(
    mocked
      ? env.mockedMicroAppsDir
      : tryFiles([
          path.resolve(env.microAppsDir),
          path.resolve(env.alternativeMicroAppsDir),
        ]),
    microAppName
  );
  const storyboardYamlFile = path.join(appDir, "storyboard.yaml");
  const storyboardJsonFile = path.join(appDir, "storyboard.json");

  let storyboard = undefined;
  if (fs.existsSync(storyboardYamlFile)) {
    try {
      storyboard = yaml.safeLoad(fs.readFileSync(storyboardYamlFile, "utf8"), {
        schema: yaml.JSON_SCHEMA,
        json: true,
      });
    } catch (e) {
      console.error(`yaml.safeLoad() error: ${storyboardYamlFile}`);
    }
  } else if (fs.existsSync(storyboardJsonFile)) {
    try {
      storyboard = JSON.parse(fs.readFileSync(storyboardJsonFile, "utf8"));
    } catch (e) {
      console.error(`JSON.parse() error: ${storyboardJsonFile}`);
    }
  }

  if (storyboard) {
    const app = storyboard.app;
    if (app && app.id) {
      const id = app.id;
      if (env.appConfig[id]) {
        app.userConfig = env.appConfig[id];
      }
    }
    if (options.brief) {
      delete storyboard.routes;
      delete storyboard.meta;
    }
  }

  return storyboard;
}

function getBrickPackages(env, standaloneConfig) {
  return getNamesOfBrickPackages(env)
    .map((name) =>
      getSingleBrickPackage(env, name, undefined, standaloneConfig)
    )
    .filter(Boolean);
}

function getNamesOfBrickPackages(env) {
  return [
    env.brickPackagesDir,
    env.alternativeBrickPackagesDir,
    env.primitiveBrickPackagesDir,
  ].flatMap((dir) =>
    fs.existsSync(dir)
      ? fs
          .readdirSync(dir, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory() || dirent.isSymbolicLink())
          .map((dirent) => dirent.name)
      : []
  );
}

function getSingleBrickPackage(
  env,
  brickPackageName,
  remoteBrickPackages,
  standaloneConfig
) {
  const {
    brickPackagesDir,
    alternativeBrickPackagesDir,
    primitiveBrickPackagesDir,
    localBrickPackages,
    localEditorPackages,
  } = env;
  let remoteJson;
  // `remoteBrickPackages` is passed only in remote-local-mixed mode.
  if (remoteBrickPackages) {
    remoteJson = remoteBrickPackages.find(
      (item) => item.filePath.split("/")[1] === brickPackageName
    );
    if (!remoteJson) {
      console.warn(
        chalk.yellow(
          `Warning: remote brick package not found: ${brickPackageName}`
        )
      );
      remoteJson = {};
    }
  } else {
    remoteJson = {};
  }
  const distDir = tryFiles([
    path.join(brickPackagesDir, brickPackageName, "dist"),
    path.join(alternativeBrickPackagesDir, brickPackageName, "dist"),
    path.join(primitiveBrickPackagesDir, brickPackageName, "dist"),
  ]);
  if (fs.existsSync(distDir)) {
    if (!remoteBrickPackages || localBrickPackages.includes(brickPackageName)) {
      let versionPart = "";
      if (standaloneConfig && standaloneConfig.standaloneVersion === 2) {
        const packageJson = JSON.parse(
          fs.readFileSync(path.resolve(distDir, "../package.json"))
        );
        versionPart = `${packageJson.version}/`;
      }
      let filePath, bricksJson;
      for (const file of fs.readdirSync(distDir)) {
        if (file.endsWith(".js")) {
          filePath = `bricks/${brickPackageName}/${versionPart}dist/${file}`;
        } else if (file === "bricks.json") {
          bricksJson = JSON.parse(
            fs.readFileSync(path.join(distDir, "bricks.json"), "utf8")
          );
        }
      }
      if (!filePath || !bricksJson) {
        return;
      }
      Object.assign(
        remoteJson,
        {
          filePath,
        },
        !remoteBrickPackages || localEditorPackages.includes(brickPackageName)
          ? omit(bricksJson, ["filePath"])
          : omit(bricksJson, ["filePath", "editors", "editorsJsFilePath"])
      );
    }
    if (
      !remoteBrickPackages ||
      localEditorPackages.includes(brickPackageName)
    ) {
      const distEditorsDir = path.join(distDir, "../dist-editors/editors.json");
      if (fs.existsSync(distEditorsDir)) {
        const editorsJson = JSON.parse(fs.readFileSync(distEditorsDir, "utf8"));
        Object.assign(remoteJson, editorsJson);
      }
    }
    return remoteJson;
  }
}

function getTemplatePackages(env) {
  return getNamesOfTemplatePackages(env)
    .map((name) => getSingleTemplatePackage(env, name))
    .filter(Boolean);
}

function getNamesOfTemplatePackages(env) {
  const templatePackagesDir = tryFiles([
    path.join(env.templatePackagesDir),
    path.join(env.alternativeTemplatePackagesDir),
  ]);
  if (!templatePackagesDir) {
    return [];
  }
  return fs
    .readdirSync(env.templatePackagesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() || dirent.isSymbolicLink())
    .map((dirent) => dirent.name);
}

function getSingleTemplatePackage(env, templatePackageName) {
  const distDir = path.join(
    env.templatePackagesDir,
    templatePackageName,
    "dist"
  );
  if (fs.existsSync(distDir)) {
    let filePath, templatesJson;
    for (const file of fs.readdirSync(distDir)) {
      if (file.endsWith(".js")) {
        filePath = `templates/${templatePackageName}/dist/${file}`;
      } else if (file === "templates.json") {
        templatesJson = JSON.parse(
          fs.readFileSync(path.join(distDir, "templates.json"), "utf8")
        );
      }
    }
    if (templatesJson && filePath) {
      return {
        ...templatesJson,
        filePath,
      };
    }
  }
}

function mergeSettings(
  defaultSettings = {
    featureFlags: {},
    homepage: "/",
    brand: {},
    misc: {},
  },
  userSettings
) {
  const { featureFlags, homepage, brand, misc } = userSettings;
  if (!defaultSettings.misc) {
    defaultSettings.misc = {};
  }
  Object.assign(defaultSettings.featureFlags, featureFlags);
  Object.assign(defaultSettings, { homepage });
  Object.assign(defaultSettings.brand, brand);
  Object.assign(defaultSettings.misc, misc);
  return defaultSettings;
}

function getUserSettings(env) {
  const yamlPath = path.join(env.rootDir, "dev-settings.yaml");
  if (!fs.existsSync(yamlPath)) {
    return {};
  }
  const { feature_flags: featureFlags, ...rest } = yaml.safeLoad(
    fs.readFileSync(yamlPath, "utf8"),
    {
      schema: yaml.JSON_SCHEMA,
      json: true,
    }
  );
  return {
    featureFlags,
    ...rest,
  };
}

function getDevSettings() {
  return {
    featureFlags: {
      "development-mode": true,
      "enable-analyzer": false,
    },
  };
}

function getSettings(env) {
  const defaultSettings = mergeSettings(
    {
      featureFlags: {},
      homepage: "/",
      brand: {},
      misc: {},
    },
    getDevSettings()
  );
  return mergeSettings(defaultSettings, getUserSettings(env));
}

// Resolve all symlinks of subdir to real path.
function listRealpathOfSubdir(dir) {
  return fs.existsSync(dir)
    ? fs
        .readdirSync(dir, {
          withFileTypes: true,
        })
        .filter((dirent) => dirent.isSymbolicLink() || dirent.isDirectory())
        .map((dirent) => fs.realpathSync(path.join(dir, dirent.name)))
    : [];
}

function getPatternsToWatch(env) {
  return [
    ...listRealpathOfSubdir(env.brickPackagesDir)
      .concat(listRealpathOfSubdir(env.alternativeBrickPackagesDir))
      .concat(listRealpathOfSubdir(env.primitiveBrickPackagesDir))
      .flatMap((dir) => [
        path.join(dir, "dist/*.js"),
        path.join(dir, "dist-editors/*.js"),
      ]),
    ...listRealpathOfSubdir(env.microAppsDir)
      .concat(listRealpathOfSubdir(env.alternativeMicroAppsDir))
      .map((dir) => path.join(dir, "storyboard.*")),
    ...listRealpathOfSubdir(env.templatePackagesDir)
      .concat(listRealpathOfSubdir(env.alternativeTemplatePackagesDir))
      .map((dir) => path.join(dir, "dist/*.js")),
    ...(env.mocked
      ? [path.join(env.mockedMicroAppsDir, "*/storyboard.*")]
      : []),
  ];
}

function checkLocalPackages(env) {
  for (const item of env.localMicroApps) {
    const itemDir = tryFiles([
      path.join(env.microAppsDir, item),
      path.join(env.alternativeMicroAppsDir, item),
    ]);
    if (!itemDir) {
      console.log(chalk.red(`Error: Local micro-apps not found: ${item}`));
    } else if (!fs.existsSync(path.join(itemDir, "package.json"))) {
      console.log(chalk.red(`Error: Local micro-apps are empty: ${item}`));
    } else if (
      !fs.existsSync(path.join(itemDir, "storyboard.yaml")) &&
      !fs.existsSync(path.join(itemDir, "storyboard.json"))
    ) {
      console.log(
        chalk.yellow(`Warning: Local micro-apps are not built yet: ${item}`)
      );
    }
  }
  for (const item of env.localBrickPackages) {
    const itemDir = tryFiles([
      path.join(env.brickPackagesDir, item),
      path.join(env.alternativeBrickPackagesDir, item),
      path.join(env.primitiveBrickPackagesDir, item),
    ]);
    if (!itemDir) {
      console.log(chalk.red(`Error: Local bricks not found: ${item}`));
    } else if (!fs.existsSync(path.join(itemDir, "package.json"))) {
      console.log(chalk.red(`Error: Local bricks are empty: ${item}`));
    } else if (!fs.existsSync(path.join(itemDir, "dist/bricks.json"))) {
      console.log(
        chalk.yellow(`Warning: Local bricks are not built yet: ${item}`)
      );
    }
  }
  for (const item of env.localTemplates) {
    const itemDir = tryFiles([
      path.join(env.templatePackagesDir, item),
      path.join(env.alternativeTemplatePackagesDir, item),
    ]);
    if (!itemDir) {
      console.log(chalk.red(`Error: Local templates not found: ${item}`));
    } else if (!fs.existsSync(path.join(itemDir, "package.json"))) {
      console.log(chalk.red(`Error: Local templates are empty: ${item}`));
    } else if (!fs.existsSync(path.join(itemDir, "dist/templates.json"))) {
      console.log(
        chalk.yellow(`Warning: Local templates are not built yet: ${item}`)
      );
    }
  }
}

function tryFiles(files) {
  for (const filePath of [].concat(files)) {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
}

function tryServeFiles(files, req, res) {
  const filePath = tryFiles(files);
  if (filePath) {
    res.sendFile(filePath);
    return;
  }
  res.status(404).json({
    error: `404 Not Found: ${req.method} ${req.originalUrl}`,
  });
}

function appendLiveReloadScript(raw, env) {
  return raw.replace(
    "</body>",
    `<script>
  const socket = new WebSocket("ws://${env.host}:${env.wsPort}");
  socket.onmessage = function(event) {
    if (event.data === "content change") {
      location.reload();
    }
  };
</script></body>`
  );
}

function removeCacheHeaders(proxyRes) {
  delete proxyRes.headers["cache-control"];
  delete proxyRes.headers["expires"];
  delete proxyRes.headers["etag"];
  delete proxyRes.headers["last-modified"];
}

exports.getNavbar = getNavbar;
exports.getStoryboardsByMicroApps = getStoryboardsByMicroApps;
exports.getSingleStoryboard = getSingleStoryboard;
exports.getBrickPackages = getBrickPackages;
exports.getSingleBrickPackage = getSingleBrickPackage;
exports.getTemplatePackages = getTemplatePackages;
exports.getSingleTemplatePackage = getSingleTemplatePackage;
exports.getSettings = getSettings;
exports.getDevSettings = getDevSettings;
exports.mergeSettings = mergeSettings;
exports.getUserSettings = getUserSettings;
exports.getNamesOfMicroApps = getNamesOfMicroApps;
exports.getNamesOfBrickPackages = getNamesOfBrickPackages;
exports.getNamesOfTemplatePackages = getNamesOfTemplatePackages;
exports.getPatternsToWatch = getPatternsToWatch;
exports.checkLocalPackages = checkLocalPackages;
exports.tryFiles = tryFiles;
exports.tryServeFiles = tryServeFiles;
exports.appendLiveReloadScript = appendLiveReloadScript;
exports.removeCacheHeaders = removeCacheHeaders;
