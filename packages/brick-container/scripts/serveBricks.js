import path from "node:path";
import fs from "node:fs";
import compression from "compression";

/**
 *
 * @param {import("express").Express} app
 * @param {string} rootDir
 */
export default function serveBricks(app, rootDir) {
  app.get("/bricks/:pkgId/dist/*", compression(), (req, res) => {
    const filePath = path.join(rootDir, req.path);
    const dirname = path.dirname(filePath);
    const basename = path.basename(filePath);
    let actualFilePath;
    const indexJsPattern = /^index\.[^.]+\.js$/;
    if (indexJsPattern.test(basename) && !fs.existsSync(filePath)) {
      const filename = fs
        .readdirSync(dirname, { withFileTypes: true })
        .filter((item) => item.isFile())
        .map((item) => item.name)
        .find((name) => indexJsPattern.test(name));
      actualFilePath = path.join(dirname, filename);
    } else if (fs.existsSync(filePath)) {
      actualFilePath = filePath;
    }
    if (actualFilePath) {
      res.sendFile(actualFilePath);
    } else {
      res.status(404).send("Not found");
    }
  });
}
