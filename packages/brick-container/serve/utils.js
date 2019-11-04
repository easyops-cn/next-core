const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

function getNavbar(env) {
  return JSON.parse(fs.readFileSync(env.navbarJsonPath, "utf8"));
}

function getStoryboardsByMicroApps(env) {
  return fs
    .readdirSync(env.microAppsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .map(name => getSingleStoryboard(env, name))
    .filter(Boolean);
}

function getSingleStoryboard(env, microAppName) {
  const storyboardJsonFile = path.join(
    env.microAppsDir,
    microAppName,
    "storyboard.json"
  );
  return fs.existsSync(storyboardJsonFile)
    ? JSON.parse(fs.readFileSync(storyboardJsonFile, "utf8"))
    : undefined;
}

function getBrickPackages(env) {
  return fs
    .readdirSync(env.brickPackagesDir)
    .map(name => getSingleBrickPackage(env, name))
    .filter(Boolean);
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
        filePath
      };
    }
  }
}

function getTemplatePackages(env) {
  return fs
    .readdirSync(env.templatePackagesDir)
    .map(name => getSingleTemplatePackage(env, name))
    .filter(Boolean);
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
        filePath
      };
    }
  }
}

function getSettings() {
  const defaultSettings = {
    featureFlags: {},
    homepage: "/",
    brand: { base_title: "DevOps 管理专家" }
  };
  const yamlPath = path.join(process.cwd(), "dev-settings.yaml");
  if (!fs.existsSync(yamlPath)) {
    return defaultSettings;
  }
  const userSettings = yaml.safeLoad(fs.readFileSync(yamlPath), "utf8");
  const { feature_flags: featureFlags, homepage, brand } = userSettings;
  Object.assign(defaultSettings.featureFlags, featureFlags);
  Object.assign(defaultSettings, { homepage });
  Object.assign(defaultSettings, { brand });
  return defaultSettings;
}

exports.getNavbar = getNavbar;
exports.getStoryboardsByMicroApps = getStoryboardsByMicroApps;
exports.getSingleStoryboard = getSingleStoryboard;
exports.getBrickPackages = getBrickPackages;
exports.getSingleBrickPackage = getSingleBrickPackage;
exports.getTemplatePackages = getTemplatePackages;
exports.getSingleTemplatePackage = getSingleTemplatePackage;
exports.getSettings = getSettings;
