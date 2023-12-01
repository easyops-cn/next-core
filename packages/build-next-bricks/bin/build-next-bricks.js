#!/usr/bin/env node
import path from "node:path";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import build from "../src/build.js";
import scanBricks from "../src/scanBricks.js";
import generatePkgBuild from "../src/generatePkgBuild.js";

/**
 * @typedef {T | Array<T>} MaybeArray<T>
 * @template {string} T
 */

/** @typedef {import("@next-core/build-next-bricks").BuildNextBricksConfig} BuildNextBricksConfig */

const manifestOnly = process.argv.includes("--manifest-only");
const watch = process.argv.includes("--watch");

try {
  const startTime = Date.now();

  const packageDir = process.cwd();
  const configJs = path.join(packageDir, "build.config.js");
  /** @type {MaybeArray<BuildNextBricksConfig>} */
  let rawConfig = {};
  if (existsSync(configJs)) {
    rawConfig = (await import(pathToFileURL(configJs))).default;
  }

  /** @type {Array<BuildNextBricksConfig>} */
  const configList = [].concat(rawConfig);

  for (const config of configList) {
    if (!config.type || config.type === "bricks") {
      const scanBricksStartAt = performance.now();
      Object.assign(config, await scanBricks(packageDir));
      const scanBricksCost = Math.round(performance.now() - scanBricksStartAt);
      console.log(
        "Scan bricks done in",
        scanBricksCost < 1000
          ? `${scanBricksCost}ms`
          : `${(scanBricksCost / 1000).toFixed(2)}s`
      );
      if (manifestOnly) {
        const distDir = path.join(packageDir, "dist");
        if (existsSync(distDir)) {
          await rm(distDir, { recursive: true });
        }
        await mkdir(distDir);
        await writeFile(
          path.join(distDir, "manifest.json"),
          JSON.stringify(config.manifest, null, 2)
        );
        await writeFile(
          path.join(distDir, "types.json"),
          JSON.stringify(config.types, null, 2)
        );
        await writeFile(
          path.join(distDir, "examples.json"),
          JSON.stringify(config.examples, null, 2)
        );
      }
    }
  }

  if (manifestOnly) {
    console.log(
      `Build bricks manifest done in ${(
        (Date.now() - startTime) /
        1000
      ).toFixed(2)}s`
    );
  } else {
    const compiler = await build(
      configList.length === 1 ? configList[0] : configList
    );

    if (watch) {
      compiler.watch({}, (err, stats) => {
        if (err || stats.hasErrors()) {
          console.error("Failed to build bricks:");
          console.error(err || stats.toString());
        } else {
          console.log("Build bricks done in watch mode");
        }
      });
    } else {
      await new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
          if (err || stats.hasErrors()) {
            console.error("Failed to build bricks:");
            reject(err || stats.toString());
          }
          // Webpack 5 requires calling close() so that persistent caching works
          // See https://github.com/webpack/webpack.js.org/pull/4775
          compiler.close((errClose) => {
            if (errClose) {
              console.error(
                `Error while closing Webpack compiler: ${errClose}`
              );
              reject(errClose);
            } else {
              resolve();
            }
          });
        });
      });

      if (
        configList.some((config) => !config.type || config.type === "bricks")
      ) {
        await generatePkgBuild(packageDir);
      }

      console.log(
        `Build bricks done in ${((Date.now() - startTime) / 1000).toFixed(2)}s`
      );
    }
  }
} catch (e) {
  console.error(e);
  process.exitCode = 1;
}
