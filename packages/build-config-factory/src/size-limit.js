const fs = require("fs");
const path = require("path");
const globby = require("globby");

function getPath(type, pkg) {
  switch (type) {
    case "bricks":
    case "templates":
      return `${type}/${pkg}/dist/index.*.js`;
    case "libs":
      return `${type}/${pkg}/dist/esm/**/*.js`;
    case "editors":
      return `bricks/${pkg}/dist/editors/editors.*.js`;
    case "lazyBricks":
      return `bricks/${pkg}/dist/lazy-bricks/**/*.js`;
    case "chunks":
      return `bricks/${pkg}/dist/chunks/**/*.js`;
    case "workers":
      return `bricks/${pkg}/dist/workers/**/*.js`;
    default:
      throw new Error(`Invalid size-limit type: ${type}`);
  }
}

module.exports = function (sizeLimitJson) {
  const dirMap = new Map(Object.entries(sizeLimitJson));
  const limits = [];

  dirMap.forEach((conf, type) => {
    const pkgMap = new Map(Object.entries(conf));
    const dir = type === "templates" || type === "libs" ? type : "bricks";

    if (!pkgMap.has("*")) {
      throw new Error(`'*' is required for ${type}`);
    }

    if (!fs.existsSync(path.resolve(dir))) {
      return;
    }

    const dirs = fs.readdirSync(path.resolve(dir), {
      encoding: "utf8",
      withFileTypes: true,
    });

    const pkgList = dirs.filter((d) => d.isDirectory()).map((d) => d.name);
    pkgList.forEach((pkg) => {
      const filePath = getPath(type, pkg);
      if (filePath.includes("*") && globby.sync(filePath).length === 0) {
        return;
      }
      limits.push({
        path: filePath,
        limit: pkg.startsWith("providers-of-")
          ? pkgMap.get("providers-of-*")
          : pkgMap.has(pkg)
          ? pkgMap.get(pkg)
          : pkgMap.get("*"),
      });
    });
  });

  // Size Limit requires non-empty config.
  if (limits.length === 0) {
    limits.push({
      path: "package.json",
      limit: "10 KB",
    });
  }

  return limits;
};
