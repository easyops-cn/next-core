const fs = require("fs");
const path = require("path");

function getPath(dir, pkg) {
  switch (dir) {
    case "bricks":
      return `${dir}/${pkg}/dist/index.*.js`;
    case "templates":
      return `${dir}/${pkg}/dist/index.*.js`;
    default:
      throw new Error(`Invalid dir: ${dir}`);
  }
}

module.exports = function(sizeLimitJson) {
  const dirMap = new Map(Object.entries(sizeLimitJson));
  const limits = [];

  dirMap.forEach((conf, dir) => {
    const pkgMap = new Map(Object.entries(conf));

    if (!pkgMap.has("*")) {
      throw new Error(`'*' is required for ${dir}`);
    }

    if (!fs.existsSync(path.resolve(dir))) {
      return;
    }

    const dirs = fs.readdirSync(path.resolve(dir), {
      encoding: "utf8",
      withFileTypes: true
    });

    const pkgList = dirs.filter(d => d.isDirectory()).map(d => d.name);
    pkgList.forEach(pkg => {
      limits.push({
        path: getPath(dir, pkg),
        limit: pkg.startsWith("providers-of-")
          ? pkgMap.get("providers-of-*")
          : pkgMap.has(pkg)
          ? pkgMap.get(pkg)
          : pkgMap.get("*"),
        running: false
      });
    });
  });

  // Size Limit requires non-empty config.
  if (limits.length === 0) {
    limits.push({
      path: "package.json",
      limit: "10 KB",
      running: false
    });
  }

  return limits;
};
