const path = require("path");
const execa = require("execa");
const rimraf = require("rimraf");

execa(
  getBinPath("@babel/cli", "babel"),
  [
    "src",
    "--out-dir",
    "dist/esm",
    "--config-file",
    "../../babel.config.js",
    "--extensions",
    ".ts,.tsx,.js,.jsx",
    "--ignore",
    [
      "src/**/*.spec.ts",
      "src/**/*.spec.tsx",
      "src/**/*.d.ts",
      "src/**/__mocks__/*",
    ].join(","),
    "--copy-files",
    "--no-copy-ignored",
    "--source-maps",
    process.argv.includes("--watch") && "--watch",
  ].filter(Boolean),
  {
    stdio: "inherit",
  }
)
  .then(
    () =>
      new Promise((resolve, reject) => {
        rimraf("dist/esm/**/__{snapshots,mocks}__", (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      })
  )
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });

function getBinPath(packageName, binName = packageName) {
  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  const packageJson = require(packageJsonPath);
  if (typeof packageJson.bin === "string") {
    return packageJson.bin;
  }
  return path.join(path.dirname(packageJsonPath), packageJson.bin[binName]);
}
