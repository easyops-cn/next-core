const path = require("path");
const fs = require("fs-extra");
const yaml = require("js-yaml");

const scopeToSuffix = new Map([
  ["@next-bricks", "NB"],
  ["@next-legacy-templates", "NT"],
  ["@bricks", "NB"],
  ["@templates", "NT"],
]);

module.exports = function generateDeps(scope) {
  const packageJson = require(path.join(process.cwd(), "package.json"));
  const { peerDependencies } = packageJson;
  const confPath = path.join(process.cwd(), "deploy-default/package.conf.yaml");
  if (!fs.existsSync(confPath)) {
    return;
  }
  const conf = yaml.safeLoad(fs.readFileSync(confPath, "utf8"));
  const existedDeps = new Set(conf.dependencies.map((dep) => dep.name));
  peerDependencies &&
    conf.dependencies.push(
      ...Object.entries(peerDependencies)
        .map(([name, version]) => {
          const [scope, pkg] = name.split("/");
          if (!scopeToSuffix.has(scope)) {
            return;
          }
          const suffix = scopeToSuffix.get(scope);
          return {
            name: `${pkg}-${suffix}`,
            version,
          };
        })
        .filter((dep) => dep && !existedDeps.has(dep.name))
    );

  if (scope === "bricks") {
    const brickNext = conf.dependencies.find(
      (dep) => dep.name === "brick_next"
    );
    if (brickNext && /^\^2(?:\.\d+){0,2}$/.test(brickNext.version)) {
      brickNext.version = `${brickNext.version} || ^3.0.0`;
    }
  }

  const content = yaml.safeDump(conf);
  fs.outputFileSync(
    path.join(process.cwd(), "deploy/package.conf.yaml"),
    content
  );
};
