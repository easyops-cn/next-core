const path = require("path");
const fs = require("fs-extra");
const globby = require("globby");
const yaml = require("js-yaml");
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
      process.exitCode = 1;
      return;
    }

    try {
      // Done processing
      console.log("contracts.log generated.");

      fs.remove(brickEntriesFilePath);

      const version = (await fs.readJson(path.join(dir, "package.json")))
        .version;
      const bricks = (await fs.readJson(path.join(dir, "dist/bricks.json")))
        .bricks;
      const depsMap = new Map();

      const contractFiles = await globby(
        path.posix.join(dir, "contracts.log/*/*.contracts")
      );
      const contractRegExp = /(?<=@contract\s+)(?:[\w.]+)(?:@[\d.]+)?(?=\s+)/g;
      await Promise.all(
        contractFiles.map(async (filePath) => {
          const source = await fs.readFile(filePath, "utf-8");
          const contracts = source.match(contractRegExp);
          const brick = path.basename(filePath, ".js.contracts");
          depsMap.set(
            brick,
            contracts?.map((item) => {
              const [contract, version] = item.split("@");
              return {
                type: "contract",
                contract,
                version: version ?? "*",
              };
            })
          );
        })
      );
      const implementedBricks = bricks.map((brick) => ({
        type: "brick",
        brick,
        version,
        deps: depsMap.get(brick),
      }));

      console.log({ implementedBricks });

      await fs.writeFile(
        path.join(dir, "deploy/contract.yaml"),
        yaml.safeDump(
          // Remove `undefined` values.
          JSON.parse(JSON.stringify({ contracts: implementedBricks }))
        )
      );
    } catch (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
};
