const path = require("path");
const fs = require("fs-extra");
const globby = require("globby");
const yaml = require("js-yaml");
const changeCase = require("change-case");
const {
  webpack,
  bricks: { webpackContractsFactory },
} = require("@next-core/webpack-config-factory");

module.exports = function generateBrickContracts(dir, isProviderBricks) {
  const brickEntriesFilePath = path.join(dir, "dist/brick-entries.json");
  const brickEntries = isProviderBricks
    ? { index: "src/index.ts" }
    : fs.readJsonSync(brickEntriesFilePath);

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

      if (!isProviderBricks) {
        fs.remove(brickEntriesFilePath);
      }

      const pkg = await fs.readJson(path.join(dir, "package.json"));
      const pkgLastName = pkg.name.split("/")[1];
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
          if (isProviderBricks) {
            if (contracts) {
              for (const item of contracts) {
                const [contract, version] = item.split("@");
                depsMap.set(
                  `${pkgLastName}.${contract
                    .split(".")
                    .slice(-2)
                    .map((seg) => changeCase.paramCase(seg))
                    .join("-api-")}`,
                  {
                    type: "contract",
                    contract,
                    version: version ?? "*",
                  }
                );
              }
            }
          } else {
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
          }
        })
      );
      const implementedBricks = bricks.map((brick) => ({
        type: "brick",
        brick,
        version: pkg.version,
        deps: depsMap.get(brick),
      }));

      console.log({ implementedBricks, depsMap });

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
