const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

function getNavbar(env) {
  return JSON.parse(fs.readFileSync(env.navbarJsonPath, "utf8"));
}

function getStoryboardsByMicroApps(env, mocked, options = {}) {
  return getNamesOfMicroApps(env, mocked)
    .map((name) => getSingleStoryboard(env, name, mocked, options))
    .filter(Boolean);
}

function getNamesOfMicroApps(env, mocked) {
  const dir = mocked ? env.mockedMicroAppsDir : env.microAppsDir;
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() || dirent.isSymbolicLink())
    .map((dirent) => dirent.name);
}

function getSingleStoryboard(env, microAppName, mocked, options = {}) {
  const storyboardJsonFile = path.join(
    mocked ? env.mockedMicroAppsDir : env.microAppsDir,
    microAppName,
    "storyboard.json"
  );
  let storyboard = undefined;
  if (fs.existsSync(storyboardJsonFile)) {
    try {
      storyboard = JSON.parse(fs.readFileSync(storyboardJsonFile, "utf8"));
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
    } catch (e) {
      console.error(`JSON.parse() error: ${storyboardJsonFile}`);
    }
  }
  return storyboard;
}

function getBrickPackages(env) {
  return getNamesOfBrickPackages(env)
    .map((name) => getSingleBrickPackage(env, name))
    .filter(Boolean);
}

function getNamesOfBrickPackages(env) {
  if (!fs.existsSync(env.brickPackagesDir)) {
    return [];
  }
  return fs
    .readdirSync(env.brickPackagesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() || dirent.isSymbolicLink())
    .map((dirent) => dirent.name);
}

function getSingleBrickPackage(env, brickPackageName) {
  const distDir = path.join(env.brickPackagesDir, brickPackageName, "dist");
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
        filePath,
      };
    }
  }
}

function getTemplatePackages(env) {
  return getNamesOfTemplatePackages(env)
    .map((name) => getSingleTemplatePackage(env, name))
    .filter(Boolean);
}

function getNamesOfTemplatePackages(env) {
  if (!fs.existsSync(env.templatePackagesDir)) {
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

function mergeSettings(defaultSettings, userSettings) {
  const { featureFlags, homepage, brand } = userSettings;
  Object.assign(defaultSettings.featureFlags, featureFlags);
  Object.assign(defaultSettings, { homepage });
  Object.assign(defaultSettings.brand, brand);
  return defaultSettings;
}

function getUserSettings() {
  const yamlPath = path.join(process.cwd(), "dev-settings.yaml");
  if (!fs.existsSync(yamlPath)) {
    return {};
  }
  const { feature_flags: featureFlags, ...rest } = yaml.safeLoad(
    fs.readFileSync(yamlPath),
    "utf8"
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
    },
  };
}

function getSettings() {
  const defaultSettings = mergeSettings(
    {
      featureFlags: {},
      homepage: "/",
      brand: {},
    },
    getDevSettings()
  );
  return mergeSettings(defaultSettings, getUserSettings());
}

// Resolve all symlinks of subdir to real path.
function listRealpathOfSubdir(dir) {
  return fs
    .readdirSync(dir, {
      withFileTypes: true,
    })
    .filter((dirent) => dirent.isSymbolicLink() || dirent.isDirectory())
    .map((dirent) => fs.realpathSync(path.join(dir, dirent.name)));
}

function getPatternsToWatch(env) {
  return [
    ...listRealpathOfSubdir(env.brickPackagesDir).map((dir) =>
      path.join(dir, "dist/*.js")
    ),
    ...listRealpathOfSubdir(env.microAppsDir).map((dir) =>
      path.join(dir, "storyboard.json")
    ),
    ...listRealpathOfSubdir(env.templatePackagesDir).map((dir) =>
      path.join(dir, "dist/*.js")
    ),
    ...(env.mocked
      ? [path.join(env.mockedMicroAppsDir, "*/storyboard.json")]
      : []),
  ];
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
