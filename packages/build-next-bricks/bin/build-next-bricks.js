#!/usr/bin/env node
import path from "node:path";
import { existsSync } from "node:fs";
import build from "../src/build.js";
import scanBricks from "../src/scanBricks.js";

try {
  const startTime = Date.now();

  const packageDir = process.cwd();
  const configJs = path.join(packageDir, "bricks.config.js");
  /** @type {import("@next-core/build-next-bricks").BuildNextBricksConfig} */
  let config = {};
  if (existsSync(configJs)) {
    config = (await import(configJs)).default;
  }

  if (config.type !== "container") {
    const scanBricksStartAt = performance.now();
    config.exposes = await scanBricks(packageDir);
    const scanBricksCost = Math.round(performance.now() - scanBricksStartAt);
    console.log(
      "Scan bricks done in",
      scanBricksCost < 1000
        ? `${scanBricksCost}ms`
        : `${(scanBricksCost / 1000).toFixed(2)}s`
    );
  }

  const compiler = await build(config);

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
  }

  // Done
  console.log(
    `Build bricks done in ${((Date.now() - startTime) / 1000).toFixed(2)}s`
  );
} catch (e) {
  console.error(e);
  process.exitCode = 1;
}
