#!/usr/bin/env node
import path from "node:path";
import { existsSync } from "node:fs";
import { copyFile, readdir, rm } from "node:fs/promises";

const bricksDir = path.join(process.cwd(), "bricks");

try {
  const dirents = await readdir(bricksDir, { withFileTypes: true });
  let count = 0;

  await Promise.all(
    dirents.map(async (item) => {
      if (!item.isDirectory()) {
        return;
      }

      const packageDir = path.join(bricksDir, item.name);
      const packageJsonPath = path.join(packageDir, "package.json");
      const packageJsonBakPath = path.join(packageDir, "package.json.bak");
      if (!existsSync(packageJsonBakPath)) {
        return;
      }

      // Resume backed-up package.json.
      await copyFile(packageJsonBakPath, packageJsonPath);
      await rm(packageJsonBakPath);

      count++;
    })
  );

  console.log("Resumed peerDependencies for %d brick packages", count);
} catch (e) {
  console.error(e);
  process.exitCode = 1;
}
