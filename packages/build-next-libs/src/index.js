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
  const packageDir = process.cwd();
  const srcDir = path.join(packageDir, "src");
  const distDir = path.join(packageDir, "dist");

  let debounceTimer;
  let watcher;
  const buildProcesses = [];

  const types = ["esm", "cjs"];
  types.forEach((type) => {
    const buildTask = build(type);
    buildProcesses.push(buildTask.childProcess);
    buildTask.catch((err) => {
      console.error("构建失败:", err);
      cleanup(1);
    });
  });

  function waitForInitialBuild(maxAttempts = 10, interval = 500) {
    return new Promise((resolve) => {
      let attempts = 0;
      const checkDist = () => {
        attempts++;
        if (
          fs.existsSync(path.join(distDir, "esm")) &&
          fs.existsSync(path.join(distDir, "cjs"))
        ) {
          resolve();
        } else if (attempts < maxAttempts) {
          setTimeout(checkDist, interval);
        } else {
          console.warn("警告: 等待初始构建超时");
          resolve();
        }
      };
      checkDist();
    });
  }

  waitForInitialBuild().then(() => {
    console.log("🔍 初始扫描构件依赖...");
    generateManifest();
  });

  const watchOptions = { persistent: true };
  const supportsRecursive =
    process.platform === "darwin" || process.platform === "win32";
  if (supportsRecursive) {
    watchOptions.recursive = true;
  }

  try {
    watcher = fs.watch(srcDir, watchOptions, (_eventType, filename) => {
      try {
        if (
          !filename ||
          filename.includes("__snapshots__") ||
          filename.includes("__mocks__") ||
          filename.includes("__fixtures__") ||
          filename.match(/\.(spec|test)\.(ts|tsx|js|jsx)$/)
        ) {
          return;
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          console.log(`\n🔄 检测到文件变化: ${filename}`);
          console.log("🔍 重新扫描构件依赖...");
          generateManifest();
        }, 1000);
      } catch (error) {
        console.error("处理文件变化时出错:", error);
      }
    });

    watcher.on("error", (error) => {
      console.error("文件监听错误:", error);
      cleanup(1);
    });
  } catch (error) {
    console.error("无法启动文件监听:", error.message);
    process.exit(1);
  }

  if (!supportsRecursive) {
    console.warn("警告: 当前平台不支持递归文件监听，仅监听顶层目录");
  }

  function cleanup(exitCode = 0) {
    console.log("\n正在停止构建和文件监听...");
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    if (watcher) {
      watcher.close();
    }
    buildProcesses.forEach((proc) => {
      if (proc && !proc.killed) {
        proc.kill();
      }
    });
    process.exit(exitCode);
  }

  process.on("SIGINT", () => cleanup(0));
  process.on("SIGTERM", () => cleanup(0));

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
