const path = require("path");
const fs = require("fs-extra");
const yaml = require("js-yaml");

module.exports = function generateDeps() {
  const packageJson = require(path.join(process.cwd(), "package.json"));
  const { peerDependencies } = packageJson;
  const confPath = path.join(process.cwd(), "deploy-default/package.conf.yaml");
  if (!fs.existsSync(confPath)) {
    return;
  }
  const conf = yaml.safeLoad(fs.readFileSync(confPath, "utf8"));
  const existedDeps = new Set(conf.dependencies.map(dep => dep.name));
  conf.dependencies.push(
    ...Object.entries(peerDependencies)
      .map(([name, version]) => {
        const [scope, pkg] = name.split("/");
        const suffix = scope === "@templates" ? "NT" : "NB";
        return {
          name: `${pkg}-${suffix}`,
          version
        };
      })
      .filter(dep => !existedDeps.has(dep.name))
  );
  const content = yaml.safeDump(conf);
  fs.outputFileSync(
    path.join(process.cwd(), "deploy/package.conf.yaml"),
    content
  );
};
