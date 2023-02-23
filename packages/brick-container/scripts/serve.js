import path from "node:path";
import express from "express";
import compression from "compression";
import bootstrapJson from "./bootstrapJson.js";
import mockAuth from "./mockAuth.js";

const app = express();

app.use(compression());

const rootDir = path.resolve(process.cwd(), "../..");

app.use("/bricks/", express.static(path.join(rootDir, "bricks")));

app.use(mockAuth());
app.use(bootstrapJson(rootDir));

app.use("/", express.static(path.join(process.cwd(), "dist")));

app.use("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "dist/index.html"));
});

app.listen(8081);

console.log("open http://localhost:8081/");
