#!/usr/bin/env node
import path from "node:path";
import { existsSync } from "node:fs";
import { build } from "../src/build.js";

try {
  const startTime = Date.now();

  const packageDir = process.cwd();
  const configJs = path.join(packageDir, "bnb.config.js");
  let config = {};
  if (existsSync(configJs)) {
    config = (await import(configJs)).default;
  }

  const compiler = await build(config);

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

  // Done
  console.log(
    `Build bricks done in ${((Date.now() - startTime) / 1000).toFixed(2)}s.`
  );
} catch (e) {
  console.error(e);
  process.exitCode = 1;
}
