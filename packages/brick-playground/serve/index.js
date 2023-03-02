import path from "node:path";
import express from "express";
import compression from "compression";
import bootstrapJson from "./bootstrapJson.js";

const app = express();

app.use(compression());

const rootDir = path.resolve(process.cwd(), "../..");

app.use(
  "/bricks/",
  express.static(path.join(rootDir, "node_modules/@next-bricks"))
);

app.use(bootstrapJson(rootDir));

app.use("/", express.static(path.join(process.cwd(), "dist")));

app.listen(8082);

console.log("open http://localhost:8082/");
