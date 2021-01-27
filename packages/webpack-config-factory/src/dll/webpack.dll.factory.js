const path = require("path");
const changeCase = require("change-case");
const NextDllPlugin = require("./NextDllPlugin");
const NextDllReferencePlugin = require("./NextDllReferencePlugin");
const NextHashedModuleIdsPlugin = require("./NextHashedModuleIdsPlugin");

module.exports = () => {
  const isProd = process.env.NODE_ENV === "production";
  const dirname = process.cwd();
  const appRoot = path.join(dirname, "..", "..");
  const distPath = path.join(dirname, "dist");

  const packageJson = require(path.join(dirname, "package.json"));
  const { name, dependencies, devDependencies } = packageJson;
  const filename = `dll-of-${name.split("/").slice(-1)[0]}`;

  const dllReferences = [];
  if (devDependencies) {
    for (const dep of Object.keys(devDependencies)) {
      if (dep === "@next-core/brick-dll" || dep.startsWith("@next-dll/")) {
        dllReferences.push(
          new NextDllReferencePlugin({
            context: appRoot,
            manifest: require(dep),
          })
        );
      }
    }
  }

  return {
    context: appRoot,
    devtool: "source-map",
    mode: isProd ? "production" : "development",
    entry: {
      [changeCase.pascalCase(filename)]: Object.keys(dependencies),
    },
    output: {
      filename: `${filename}.js`,
      path: distPath,
      library: "[name]",
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          enforce: "pre",
          use: ["source-map-loader"],
        },
      ],
    },
    plugins: [
      ...dllReferences,
      new NextDllPlugin({
        name: "[name]",
        path: path.join(distPath, "manifest.json"),
      }),
      new NextHashedModuleIdsPlugin(),
    ],
    resolve: {
      // only resolve .js extension files
      // Note that we does not resolve .json for significantly lower IO requests
      extensions: [".ts", ".js"],
      // modules: [path.join(appRoot, "node_modules")],
      symlinks: false,
    },
    performance: {
      hints: false,
    },
  };
};
