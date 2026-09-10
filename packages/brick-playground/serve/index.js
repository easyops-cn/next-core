import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import compression from "compression";
import {
  loadDevConfig,
  resolveLocalBrickFolders,
  serveBricks,
} from "@next-core/serve-helpers";
import bootstrapJson from "./bootstrapJson.js";
import examplesJson from "./examplesJson.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(compression());

const rootDir = process.cwd();

let brickFolders = ["node_modules/@next-bricks", "node_modules/@bricks"];
let configuredBrickFolders = false;
let mocks;

const devConfig = await loadDevConfig(rootDir);
if (devConfig) {
  if (Array.isArray(devConfig.brickFolders)) {
    brickFolders = devConfig.brickFolders;
    configuredBrickFolders = true;
  }
  mocks = devConfig.mocks;
}

const localBrickFolders = await resolveLocalBrickFolders(rootDir, brickFolders);

for (const mock of mocks ?? []) {
  app.use(mock);
}

app.use("/preview/bricks/", serveBricks({ localBrickFolders }));

app.use("/preview/", bootstrapJson(localBrickFolders));
app.use(examplesJson(rootDir));

app.use("/", express.static(path.join(__dirname, "../dist")));

app.listen(8082);

if (configuredBrickFolders) {
  console.log("local brick folders:", localBrickFolders);
}

console.log("open http://localhost:8082/");
