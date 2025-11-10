#!/usr/bin/env node
import { existsSync } from "node:fs";
import { copyFile } from "node:fs/promises";
import path from "node:path";

const packageDir = process.cwd();
const jsxDtsSrc = path.join(packageDir, "src", "jsx.d.ts");
const jsxDtsDestDir = path.join(packageDir, "dist-types");
const jsxDtsDest = path.join(jsxDtsDestDir, "jsx.d.ts");

async function copyJsxDts() {
  try {
    if (!existsSync(jsxDtsSrc)) {
      console.log(`Source file ${jsxDtsSrc} does not exist. Skipping copy.`);
      return;
    }

    await copyFile(jsxDtsSrc, jsxDtsDest);
    console.log(`Copied ${jsxDtsSrc} to ${jsxDtsDest}`);
  } catch (error) {
    console.error("Error copying jsx.d.ts:", error);
    process.exit(1);
  }
}

copyJsxDts();
