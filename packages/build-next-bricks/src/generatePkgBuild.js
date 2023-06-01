#!/usr/bin/env node
import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { copyFile, readFile, writeFile } from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {string} packageDir
 */
export default async function generatePkgBuild(packageDir) {
  const targetPkgBuildDir = path.join(packageDir, ".pkgbuild");
  if (!existsSync(targetPkgBuildDir)) {
    mkdirSync(targetPkgBuildDir);
  }

  const targetDeployDir = path.join(packageDir, "deploy");
  if (!existsSync(targetDeployDir)) {
    mkdirSync(targetDeployDir);
  }

  await Promise.all([
    copyFile(
      path.join(__dirname, "../template/.pkgbuild/PKGBUILD"),
      path.join(targetPkgBuildDir, "PKGBUILD")
    ),
    [
      "install_postscript.sh",
      "update_postscript.sh",
      "update_prescript.sh",
    ].map((filename) =>
      copyFile(
        path.join(__dirname, "../template/deploy", filename),
        path.join(targetDeployDir, filename)
      )
    ),
  ]);

  const pkgName = path.basename(packageDir);
  /**
   * @type {[string, string][]}
   */
  const patterns = Object.entries({
    "$install-path-dir$": "bricks",
    "$scope-name$": "bricks",
    "$package-name$": pkgName,
    "$suffix-name$": "NB",
  });

  await Promise.all(
    [
      path.join(targetPkgBuildDir, "PKGBUILD"),
      path.join(targetDeployDir, "install_postscript.sh"),
    ].map((filePath) => replacePatterns(filePath, patterns))
  );

  const defaultConfPath = path.join(
    packageDir,
    "deploy-default/package.conf.yaml"
  );
  const targetConfPath = path.join(packageDir, "deploy/package.conf.yaml");

  if (existsSync(defaultConfPath)) {
    // Todo: merge default conf with dependencies in package json.
    await copyFile(defaultConfPath, targetConfPath);
  } else {
    await writeFile(
      targetConfPath,
      `install_path: /usr/local/easyops/bricks/${pkgName}-NB
user: "easyops:easyops"
dependencies:
  - name: brick_next
    version: ^2.86.3 || ^3.0.0
    local_deploy: true
`
    );
  }
}

/**
 * @param {string} filePath
 * @param {[string, string][]} replacements
 */
async function replacePatterns(filePath, replacements) {
  const content = await readFile(filePath, "utf-8");
  const newContent = replacements.reduce(
    (str, [s, r]) => str.replace(s, r),
    content
  );
  await writeFile(filePath, newContent);
}
