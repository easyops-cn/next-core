const path = require("path");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const NextDllReferencePlugin = require("../dll/NextDllReferencePlugin");
const ScanUseProviderHookContractsPlugin = require("./ScanUseProviderHookContractsPlugin");

/**
 * This webpack configuration is used only for contract analysis.
 */
module.exports = (cwdDirname = process.cwd(), brickEntries) => {
  const appRoot = path.join(cwdDirname, "..", "..");

  const packageJson = require(path.join(cwdDirname, "package.json"));
  const dll = Object.keys(packageJson.peerDependencies || {}).filter((name) =>
    name.startsWith("@next-dll/")
  );

  return Object.entries(brickEntries).map(([brick, relativePath]) => ({
    context: appRoot,
    entry: {
      [brick]: path.join(cwdDirname, relativePath),
    },
    output: {
      // During webpack building, assets are written into
      // a temporary directory `dist-editors`.
      // And later to be merged into `dist/editors` during post-building.
      path: path.join(cwdDirname, "contracts.log", brick),
      publicPath: "/",
    },
    mode: "production",
    devtool: false,
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: {
            condition: /@contract/,
            filename: (file) => {
              // A file can contain a query string (for example when you have `output.filename: '[name].js?[chunkhash]'`)
              // You must consider this
              return file.replace(/\.(\w+)($|\?)/, ".$1.contracts$2");
            },
          },
        }),
      ],
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
      symlinks: false,
      alias: {
        // This alias is a temporary fix for legacy of
        // `@easyops/brick-http <- @sdk/* <- @next-core/brick-kit`.
        "@easyops": "@next-core",
      },
    },
    module: {
      rules: [
        {
          // Ignore worker modules and node modules other than libs and sdk,
          // which do not matter with contracts.
          resource: {
            and: [
              {
                test: /\.(ts|js)x?$/,
              },
              {
                // Match one of below.
                test: [
                  /\.worker\./,
                  // Code in node_modules other than libs and sdk.
                  /\/node_modules\/(?!@(?:next-)?(?:libs|sdk)\/)/,
                ],
              },
            ],
          },
          use: "null-loader",
        },
        {
          // Include ts, tsx, js, and jsx files.
          test: /\.(ts|js)x?$/,
          exclude: /node_modules|\.worker\./,
          loader: "babel-loader",
          options: {
            rootMode: "upward",
          },
        },
      ],
    },
    plugins: [
      new webpack.IgnorePlugin({
        // Ignore all non-js files, which do not matter with contracts.
        checkResource(resource) {
          return /\.\w+$/.test(resource) && !/\.(ts|js)x?$/.test(resource);
        },
      }),
      new CleanWebpackPlugin(),
      new ScanUseProviderHookContractsPlugin({
        printWarning: true,
      }),
      new NextDllReferencePlugin({
        context: appRoot,
        // 解决该包在 `npm link` 下引用到错误的包路径的问题
        manifest: require(require.resolve("@next-core/brick-dll", {
          paths: [cwdDirname],
        })),
      }),
      ...dll.map(
        (name) =>
          new NextDllReferencePlugin({
            context: appRoot,
            // 解决该包在 `npm link` 下引用到错误的包路径的问题
            manifest: require(require.resolve(name, {
              paths: [cwdDirname],
            })),
          })
      ),
    ],
  }));
};
