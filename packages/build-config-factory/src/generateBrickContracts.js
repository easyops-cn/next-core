const path = require("path");
const fs = require("fs-extra");
const globby = require("globby");
const {
  webpack,
  bricks: { webpackContractsFactory },
} = require("@next-core/webpack-config-factory");

module.exports = function generateBrickContracts(dir) {
  const brickEntriesFilePath = path.join(dir, "dist/brick-entries.json");
  const brickEntries = JSON.parse(
    fs.readFileSync(brickEntriesFilePath, "utf-8")
  );

  webpack(webpackContractsFactory(dir, brickEntries), async (err, stats) => {
    if (err || stats.hasErrors()) {
      // [Handle errors here](#error-handling)
      console.error("Failed to generate brick contracts:");
      console.error(err || stats);
      return;
    }
    // Done processing
    console.log("contracts.log generated.");

    fs.remove(brickEntriesFilePath);

    const contractFiles = await globby(
      path.posix.join(dir, "contracts.log/*/*.contracts")
    );
    for (const filePath of contractFiles) {
      const source = fs.readFileSync(filePath, "utf-8");
      const contracts = source.match(/(?<=@contract\s+)([\w.]+)(?=\s+)/g);
      console.log(`${path.basename(filePath, ".js.contracts")}:`);
      for (const contract of contracts) {
        console.log(`  - ${contract}`);
      }
    }
  });
};
