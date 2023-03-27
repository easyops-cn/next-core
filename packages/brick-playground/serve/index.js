import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import compression from "compression";
import bootstrapJson from "./bootstrapJson.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(compression());

const rootDir = process.cwd();

app.use(
  "/bricks/",
  express.static(path.join(rootDir, "node_modules/@next-bricks"))
);

app.use("/bricks/", express.static(path.join(rootDir, "node_modules/@bricks")));

app.use(bootstrapJson(rootDir));

app.use("/", express.static(path.join(__dirname, "../dist")));

app.listen(8082);

console.log("open http://localhost:8082/");
