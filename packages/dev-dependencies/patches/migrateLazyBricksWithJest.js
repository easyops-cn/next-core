const path = require("path");
const fs = require("fs-extra");

function migrateLazyBricksWithJest() {
  const packageDir = path.resolve("bricks");

  if (!fs.existsSync(packageDir)) {
    return;
  }

  fs.readdirSync(packageDir, { withFileTypes: true })
    .filter((dir) => dir.isDirectory())
    .forEach((dir) => {
      const indexSpecPath = path.join(
        packageDir,
        dir.name,
        "src",
        "index.spec.ts"
      );

      if (fs.existsSync(indexSpecPath)) {
        const indexSpecFile = fs.readFileSync(indexSpecPath, "utf-8");
        fs.outputFileSync(
          indexSpecPath,
          indexSpecFile.replace(`jest.mock("./lazy-bricks", () => void 0);`, "")
        );
      }
    });
}

module.exports = migrateLazyBricksWithJest;
