import path from "node:path";
import fs from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import compression from "compression";

/**
 *
 * @param {import("express").Express} app
 * @param {string} rootDir
 */
export default function serveBricks(app, rootDir) {
  app.get("/bricks/:pkgId/dist/*", compression(), async (req, res) => {
    const filePath = path.join(rootDir, req.path);
    const dirname = path.dirname(filePath);
    const basename = path.basename(filePath);
    let actualFilePath;
    const fuzzy = false;
    const indexJsPattern = /^index\.[^.]+\.js$/;
    if (fuzzy && indexJsPattern.test(basename) && !fs.existsSync(filePath)) {
      const list = await readdir(dirname, { withFileTypes: true });
      const filename = list
        .filter((item) => item.isFile())
        .map((item) => item.name)
        .find((name) => indexJsPattern.test(name));
      actualFilePath = path.join(dirname, filename);
    } else if (fs.existsSync(filePath)) {
      actualFilePath = filePath;
    }
    // Simulate network delay.
    // if (req.params.pkgId === "basic") {
    //   await new Promise(resolve => {
    //     setTimeout(resolve, 100);
    //   });
    // }
    if (actualFilePath) {
      res.sendFile(actualFilePath);
    } else {
      res.status(404).send("Not found");
    }
  });

  app.get("/bootstrap.hash.json", async (req, res) => {
    res.json({
      brickPackages: await getBrickPackages(rootDir),
    });
  });
}

async function getBrickPackages(rootDir) {
  const dirs = await readdir(path.join(rootDir, "bricks"), {
    withFileTypes: true,
  });
  return (
    await Promise.all(
      dirs
        .filter((item) => item.isDirectory())
        .map(async (dir) => {
          const bricksJsonPath = path.join(
            rootDir,
            "bricks",
            dir.name,
            "dist/bricks.json"
          );
          if (fs.existsSync(bricksJsonPath)) {
            const files = await readdir(path.dirname(bricksJsonPath));
            const indexJsFile = files.find((item) => item.endsWith(".js"));
            if (indexJsFile) {
              const bricksJson = JSON.parse(
                await readFile(bricksJsonPath, "utf-8")
              );
              return {
                filePath: indexJsFile,
                ...bricksJson,
              };
            }
          }
        })
    )
  ).filter(Boolean);
}
