const path = require("path");
const execa = require("execa");
const { rimraf } = require("rimraf");
const { generateDependencyManifest } = require("./scanDeps");

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

Promise.all(["esm", "cjs"].map((type) => build(type)))
  .then(() => {
    // 构建完成后，生成依赖清单
    try {
      const packageDir = process.cwd();
      const outputDir = path.join(packageDir, "dist");
      generateDependencyManifest(packageDir, outputDir);
    } catch (error) {
      console.warn("警告: 生成构件依赖清单失败:", error.message);
      // 不阻塞构建流程
    }
  })
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
