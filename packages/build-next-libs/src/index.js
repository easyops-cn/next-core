const path = require("path");
const fs = require("fs");
const execa = require("execa");
const { rimraf } = require("rimraf");
const { generateDependencyManifest } = require("./scanDeps");

const babel = getBinPath("@babel/cli", "babel");

const isWatchMode = process.argv.includes("--watch");

function generateManifest() {
  try {
    const packageDir = process.cwd();
    const outputDir = path.join(packageDir, "dist");
    generateDependencyManifest(packageDir, outputDir);
  } catch (error) {
    console.warn("警告: 生成构件依赖清单失败:", error.message);
    // 不阻塞构建流程
  }
}

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
      ...(isWatchMode ? ["--watch"] : []),
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

if (isWatchMode) {
  // Watch 模式：监听源文件变化并重新生成依赖清单
  const packageDir = process.cwd();
  const srcDir = path.join(packageDir, "src");

  // 启动构建任务
  Promise.all(["esm", "cjs"].map((type) => build(type))).catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });

  // 初始生成依赖清单
  console.log("🔍 初始扫描构件依赖...");
  generateManifest();

  // 监听 src 目录变化
  let debounceTimer;
  fs.watch(srcDir, { recursive: true }, (_eventType, filename) => {
    // 忽略非代码文件
    if (
      !filename ||
      filename.includes("__snapshots__") ||
      filename.includes("__mocks__") ||
      filename.includes("__fixtures__") ||
      filename.match(/\.(spec|test)\.(ts|tsx|js|jsx)$/)
    ) {
      return;
    }

    // 防抖：避免频繁触发
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log(`\n🔄 检测到文件变化: ${filename}`);
      console.log("🔍 重新扫描构件依赖...");
      generateManifest();
    }, 1000);
  });

  console.log("👀 正在监听源文件变化以更新构件依赖清单...\n");
} else {
  // 非 watch 模式：构建完成后生成依赖清单
  Promise.all(["esm", "cjs"].map((type) => build(type)))
    .then(() => {
      // 构建完成后，生成依赖清单
      generateManifest();
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
}

function getBinPath(packageName, binName = packageName) {
  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  const packageJson = require(packageJsonPath);
  if (typeof packageJson.bin === "string") {
    return packageJson.bin;
  }
  return path.join(path.dirname(packageJsonPath), packageJson.bin[binName]);
}
