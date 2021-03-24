const path = require("path");
const fs = require("fs-extra");
const TypeDoc = require("typedoc");

module.exports = async function generateProviderDocs(packageName) {
  const app = new TypeDoc.Application();
  const providersJson = require(path.resolve("providers.json"));

  app.options.addReader(new TypeDoc.TSConfigReader());

  const tsconfigFilename = "tsconfig.providerDocs.json";
  const tsconfigPath = path.resolve(tsconfigFilename);

  fs.copyFileSync(path.join(__dirname, tsconfigFilename), tsconfigPath);

  app.bootstrap({
    tsconfig: tsconfigPath,
    // tsconfig: path.resolve("../../tsconfig.providerDocs.json"),
    excludeExternals: true,
    entryPoints: [
      path.dirname(
        require.resolve(`${providersJson.sdk}/dist/types/index.d.ts`, {
          paths: [process.cwd()],
        })
      ),
    ],
  });

  const project = app.convert();

  if (project) {
    await app.generateJson(project, path.resolve(`dist/docs.json`));
    console.log(`Providers docs for ${packageName} generated.`);
  } else {
    throw new Error(`typedoc convert failed for ${packageName}`);
  }
};
