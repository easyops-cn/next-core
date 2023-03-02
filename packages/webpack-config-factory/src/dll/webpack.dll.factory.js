const path = require("path");
const changeCase = require("change-case");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const NextDllPlugin = require("./NextDllPlugin");
const NextDllReferencePlugin = require("./NextDllReferencePlugin");
const NextHashedModuleIdsPlugin = require("./NextHashedModuleIdsPlugin");

module.exports = ({ migrateToBrickNextV3 } = {}) => {
  const isProd = process.env.NODE_ENV === "production";
  const dirname = process.cwd();
  const appRoot = path.join(dirname, "..", "..");
  const distPath = path.join(dirname, "dist");

  const packageJson = require(path.join(dirname, "package.json"));
  const { name, peerDependencies, devDependencies } = packageJson;
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
      [changeCase.pascalCase(filename)]: Object.keys(peerDependencies),
    },
    output: {
      filename: isProd
        ? `${filename}.[contenthash].js`
        : `${filename}.bundle.js`,
      path: distPath,
      library: "[name]",
      hashDigestLength: 8,
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
      new CleanWebpackPlugin(),
      ...dllReferences,
      new NextDllPlugin({
        name: "[name]",
        path: path.join(distPath, "manifest.json"),
        migrateToBrickNextV3,
      }),
      new NextHashedModuleIdsPlugin({ migrateToBrickNextV3 }),
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
