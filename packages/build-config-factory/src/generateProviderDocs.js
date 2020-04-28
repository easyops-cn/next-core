const path = require("path");
const TypeDoc = require("typedoc");
const getEasyopsConfig = require("../getEasyopsConfig")

module.exports = function generateProviderDocs(packageName) {
  const app = new TypeDoc.Application();
  const providersJson = require(path.resolve("providers.json"));

  app.bootstrap({
    // tsconfig
    module: "ESNext",
    target: "ESNext",
    moduleResolution: "node",
    skipLibCheck: true,
    esModuleInterop: true,
    experimentalDecorators: true,

    // typedoc config
    excludeExternals: true,
    excludeNotExported: true,
    includeDeclarations: true
  });

  const easyopsConfig = getEasyopsConfig.easyopsConfig
  const providerPath = (getEasyopsConfig.isEasyopsConfigExists && easyopsConfig === false) ? path.join(process.cwd(), `../../${providersJson.sdk}/dist/types/index.d.ts`): ''
  const project = app.convert(
    app.expandInputFiles([
      path.dirname(
        require.resolve(providerPath||`${providersJson.sdk}/dist/types/index.d.ts`, {
          paths: [process.cwd()]
        })
      )
    ])
  );

  if (project) {
    app.generateJson(project, path.resolve(`dist/docs.json`));
    console.log(`Providers docs for ${packageName} generated.`);
  } else {
    throw new Error(`typedoc convert failed for ${packageName}`);
  }
};
