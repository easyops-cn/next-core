import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import express from "express";
import compression from "compression";
import glob from "glob";
import bootstrapJson from "./bootstrapJson.js";
import examplesJson from "./examplesJson.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(compression());

const rootDir = process.cwd();

let brickFolders = ["node_modules/@next-bricks", "node_modules/@bricks"];
const devConfigMjs = path.join(rootDir, "dev.config.mjs");
let configuredBrickFolders = false;

if (existsSync(devConfigMjs)) {
  const devConfig = (await import(devConfigMjs)).default;
  if (devConfig) {
    if (Array.isArray(devConfig.brickFolders)) {
      brickFolders = devConfig.brickFolders;
      configuredBrickFolders = true;
    }
  }
}

const localBrickFolders = (
  await Promise.all(
    brickFolders.map(
      (folder) =>
        new Promise((resolve, reject) => {
          glob(path.resolve(rootDir, folder), {}, (err, matches) => {
            if (err) {
              reject(err);
            } else {
              resolve(matches);
            }
          });
        })
    )
  )
).flat();

for (const folder of localBrickFolders) {
  app.use("/preview/bricks/", express.static(folder));
}

app.use("/preview/", bootstrapJson(localBrickFolders));
app.use(examplesJson(rootDir));

app.use("/", express.static(path.join(__dirname, "../dist")));

app.listen(8082);

if (configuredBrickFolders) {
  console.log("local brick folders:", localBrickFolders);
}

console.log("open http://localhost:8082/");
