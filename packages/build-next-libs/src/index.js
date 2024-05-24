const path = require("path");
const execa = require("execa");
const { rimraf } = require("rimraf");

const babel = getBinPath("@babel/cli", "babel");

function build(type) {
  const task = execa(
    babel,
    [
      "src",
      "--out-dir",
      `dist/${type}`,
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
        "src/**/__fixtures__/*",
      ].join(","),
      ...(type === "cjs" ? [] : ["--copy-files", "--no-copy-ignored"]),
      "--source-maps",
      ...(process.argv.includes("--watch") ? ["--watch"] : []),
    ],
    {
      stdio: "inherit",
      env:
        type === "cjs"
          ? {
              BABEL_ENV: "commonjs",
            }
          : undefined,
    }
  );

  return type === "cjs"
    ? task
    : task.then(() =>
        rimraf(`dist/{${type},types}/**/__{snapshots,mocks,fixtures}__`, {
          glob: true,
        })
      );
}

Promise.all(["esm", "cjs"].map((type) => build(type))).catch((err) => {
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
