#!/usr/bin/env node
import path from "node:path";
import { existsSync } from "node:fs";
import build from "../src/build.js";
import scanBricks from "../src/scanBricks.js";

/**
 * @typedef {T | Array<T>} MaybeArray<T>
 * @template {string} T
 */

/** @typedef {import("@next-core/build-next-bricks").BuildNextBricksConfig} BuildNextBricksConfig */

try {
  const startTime = Date.now();

  const packageDir = process.cwd();
  const configJs = path.join(packageDir, "build.config.js");
  /** @type {MaybeArray<BuildNextBricksConfig>} */
  let rawConfig = {};
  if (existsSync(configJs)) {
    rawConfig = (await import(configJs)).default;
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
    }
  }

  const compiler = await build(
    configList.length === 1 ? configList[0] : configList
  );

  const watch = process.argv.includes("--watch");

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
        } else {
          resolve();
        }
      });
    });

    console.log(
      `Build bricks done in ${((Date.now() - startTime) / 1000).toFixed(2)}s`
    );
  }
} catch (e) {
  console.error(e);
  process.exitCode = 1;
}