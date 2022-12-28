import path from "node:path";
import express from "express";
import compression from "compression";
import serveBricks from "./serveBricks.js";

const app = express();

app.use(compression());

const rootDir = path.resolve(process.cwd(), "../..");

serveBricks(app, rootDir);

app.use("/", express.static(path.join(process.cwd(), "dist")));

// app.use("/bricks/", express.static(path.join(rootDir, "bricks")));

app.listen(8082);

console.log("open http://localhost:8082/");
