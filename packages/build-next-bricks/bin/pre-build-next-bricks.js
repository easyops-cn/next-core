#!/usr/bin/env node
import path from "node:path";
import { copyFile, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import * as prettier from "prettier";

const bricksDir = path.join(process.cwd(), "bricks");

const matchBrickPackages = (key) => /^@(?:next-)?bricks\//.test(key);

try {
  const dirents = await readdir(bricksDir, { withFileTypes: true });

  await Promise.all(
    dirents.map(async (item) => {
      if (!item.isDirectory()) {
        return;
      }

      const packageDir = path.join(bricksDir, item.name);
      const packageJsonPath = path.join(packageDir, "package.json");
      if (!existsSync(packageJsonPath)) {
        return;
      }

      const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));

      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};
      const peerDependencies = packageJson.peerDependencies || {};

      // If error was thrown when building, thus pre-build was performed but post-build wasn't,
      // so we handle this situation: remove deps that is copied when pre-building.
      let changed = false;
      for (const [dep, version] of Object.entries(peerDependencies)) {
        if (dependencies[dep] === version) {
          delete dependencies[dep];
          changed = true;
        }
        if (devDependencies[dep] === version) {
          delete devDependencies[dep];
          changed = true;
        }
      }
      if (changed) {
        await writeFile(
          packageJsonPath,
          await prettier.format(JSON.stringify(packageJson, null, 2), {
            filepath: packageJsonPath,
          })
        );
      }

      // If there were still "@next-bricks/*" in dependencies or devDependencies,
      // throw an error. Should put them into peerDependencies.
      if (
        Object.keys(dependencies)
          .concat(Object.keys(devDependencies))
          .some(matchBrickPackages)
      ) {
        throw new Error(
          `Please put other "@next-bricks/*" into peerDependencies instead of dependencies or devDependencies for your brick package: ${packageJson.name}`
        );
      }
    })
  );

  await Promise.all(
    dirents.map(async (item) => {
      if (!item.isDirectory()) {
        return;
      }

      const packageDir = path.join(bricksDir, item.name);
      const packageJsonPath = path.join(packageDir, "package.json");
      const packageJsonBakPath = path.join(packageDir, "package.json.bak");
      if (!existsSync(packageJsonPath)) {
        return;
      }

      const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));

      const peerDependencies = packageJson.peerDependencies || {};
      const bricksPeerDependencies =
        Object.keys(peerDependencies).filter(matchBrickPackages);
      if (bricksPeerDependencies.length === 0) {
        return;
      }
      // Make a copy as backup file.
      await copyFile(packageJsonPath, packageJsonBakPath);

      // Copy "@next-bricks/*" from peerDependencies to devDependencies.
      const devDependencies = (packageJson.devDependencies ??= {});
      for (const dep of bricksPeerDependencies) {
        devDependencies[dep] = peerDependencies[dep];
      }

      await writeFile(
        packageJsonPath,
        await prettier.format(JSON.stringify(packageJson, null, 2), {
          filepath: packageJsonPath,
        })
      );
    })
  );
} catch (e) {
  console.error(e);
  process.exitCode = 1;
}
