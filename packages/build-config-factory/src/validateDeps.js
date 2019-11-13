const path = require("path");
const { isEmpty } = require("lodash");

module.exports = function ensureDeps(scope) {
  const packageJson = require(path.join(process.cwd(), "package.json"));

  if (scope === "bricks") {
    if (
      !isEmpty(packageJson.dependencies) ||
      !isEmpty(packageJson.peerDependencies)
    ) {
      throw new Error(
        "`@" +
          scope +
          "/*` should not have any `dependencies` or `peerDependencies`, use `devDependencies` instead."
      );
    }
    const devDependencies = Object.keys(packageJson.devDependencies || {});
    if (
      devDependencies.some(
        name =>
          name.startsWith("@bricks/") ||
          name.startsWith("@templates/") ||
          name.startsWith("@micro-apps/")
      )
    ) {
      throw new Error(
        "`@" +
          scope +
          "/*` should never depend on `@templates/*` or `@micro-apps/*` or other `@bricks/*`."
      );
    }
    if (!devDependencies.includes("@easyops/brick-dll")) {
      throw new Error(
        "`@" +
          scope +
          "/*` should always have a dev-dependency of `@easyops/brick-dll`."
      );
    }
  } else if (scope === "micro-apps" || scope === "templates") {
    if (!isEmpty(packageJson.dependencies)) {
      throw new Error(
        "`@" +
          scope +
          "/*` should not have any `dependencies`, use `peerDependencies` for `@bricks/*` and `@templates/*`, use `devDependencies` for others."
      );
    }
    const peerDependencies = Object.keys(packageJson.peerDependencies || {});
    if (
      peerDependencies.some(
        name => !(name.startsWith("@bricks/") || name.startsWith("@templates/"))
      )
    ) {
      throw new Error(
        "`@" +
          scope +
          "/*` should only contain `@bricks/*` and `@templates/*` in `peerDependencies`, use `devDependencies` for others."
      );
    }
    const devDependencies = Object.keys(packageJson.devDependencies || {});
    if (
      devDependencies.some(
        name => name.startsWith("@bricks/") || name.startsWith("@templates/")
      )
    ) {
      throw new Error(
        "`@" +
          scope +
          "/*` should only contain `@bricks/*` and `@templates/*` in `peerDependencies`."
      );
    }
  }

  if (scope === "bricks" || scope === "templates") {
    if (packageJson.sideEffects !== true) {
      throw new Error(
        "`@" + scope + "/*` should always set `sideEffects: true`."
      );
    }
  } else if (scope === "micro-apps") {
    if (packageJson.sideEffects === true) {
      throw new Error(
        "`@" + scope + "/*` should always not set `sideEffects: true`."
      );
    }
  }
};
