const path = require("path");
const fs = require("fs-extra");
const globby = require("globby");
const yaml = require("js-yaml");
const {
  webpack,
  bricks: { webpackContractsFactory },
} = require("@next-core/webpack-config-factory");

module.exports = function generateBrickContracts(brickPackageDir) {
  console.log("Analysing brick contracts...");
  const startTime = Date.now();
  const brickEntriesJsonPath = path.join(
    brickPackageDir,
    "dist/brick-entries.json"
  );
  const brickEntries = fs.readJsonSync(brickEntriesJsonPath);

  webpack(
    webpackContractsFactory(brickPackageDir, brickEntries),
    async (err, stats) => {
      if (err || stats.hasErrors()) {
        // [Handle errors here](#error-handling)
        console.error("Failed to generate brick contracts:");
        console.error(err || stats.toString());
        process.exitCode = 1;
        return;
      }
      // Done processing
      console.log(
        `contracts.log generated in ${((Date.now() - startTime) / 1000).toFixed(
          2
        )}s.`
      );

      const contractFiles = await globby(
        path.posix.join(brickPackageDir, "contracts.log/*/*.contracts")
      );
      const mapOfBrickToContracts = new Map();
      for (const filePath of contractFiles) {
        mapOfBrickToContracts.set(
          // Brick name:
          path.basename(filePath, ".js.contracts"),
          // Contracts:
          fs
            .readFileSync(filePath, "utf-8")
            .match(/(?<=@contract\s+)([\w.]+)(?=\s+)/g) || []
        );
      }

      // Cover all bricks including those with no contracts.
      const { bricks } = fs.readJsonSync(
        path.join(brickPackageDir, "dist/bricks.json")
      );
      const bricksWithContracts = bricks.map((brick) => ({
        brick,
        contracts: (mapOfBrickToContracts.get(brick) || []).map((contract) => ({
          contract,
          version: "*",
        })),
      }));

      // Todo(steve): write file.
      console.log(yaml.safeDump({ bricks: bricksWithContracts }));

      // Clear `brick-entries.json`.
      fs.remove(brickEntriesJsonPath);
    }
  );
};
