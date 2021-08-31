const path = require("path");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const prism = require("prismjs");
const loadLanguages = require("prismjs/components/index");
const { lessReplacePlugin } = require("@next-core/less-plugin-css-variables");
const ScanCustomElementsPlugin = require("./ScanCustomElementsPlugin");
const ScanTemplatesPlugin = require("./ScanTemplatesPlugin");
const ScanEditorBricksPlugin = require("./ScanEditorBricksPlugin");
const NextDllReferencePlugin = require("../dll/NextDllReferencePlugin");
const BrickHashedModuleIdsPlugin = require("./BrickHashedModuleIdsPlugin");

const getCssLoader = (cssOptions) => ({
  loader: "css-loader",
  options: {
    // Todo(steve): based on env.
    sourceMap: false,
    ...cssOptions,
  },
});

const getStyleLoaders = (cssOptions) => [
  getCssLoader(cssOptions),
  {
    loader: "postcss-loader",
    options: {
      ident: "postcss",
      sourceMap: false,
      plugins: () => [
        require("postcss-nested")(),
        require("postcss-preset-env")(),
      ],
    },
  },
];

loadLanguages(["ts", "tsx", "json"]);

const highlight = (code, lang) => {
  const grammar = prism.languages[lang];
  if (grammar) {
    return prism.highlight(code, grammar, lang);
  }
  return code;
};

const getImageLoaderOptions = () => ({
  use: [
    {
      loader: "url-loader",
      options: {
        name: "assets/[name].[hash:8].[ext]",
        limit: 8192,
        esModule: false,
      },
    },
  ],
});

module.exports =
  (isForEditors) =>
  ({
    scope = "bricks",
    copyFiles = [],
    ignores = [],
    splitVendorsForLazyBricks,
  } = {}) => {
    const cwdDirname = process.cwd();
    const appRoot = path.join(cwdDirname, "..", "..");
    const pkgRelativeRoot = path.relative(appRoot, cwdDirname);
    const distPublicPath = pkgRelativeRoot
      .split(path.sep)
      .concat(isForEditors ? ["dist", "editors/"] : ["dist/"])
      .join("/");
    const imageLoaderOptions = getImageLoaderOptions();

    const packageJson = require(path.join(cwdDirname, "package.json"));
    const packageName = packageJson.name.split("/")[1];
    const dll = isForEditors
      ? ["@next-dll/editor-bricks-helper"]
      : Object.keys(packageJson.peerDependencies || {}).filter((name) =>
          name.startsWith("@next-dll/")
        );
    const entryPair = isForEditors
      ? ["editors", "editor-bricks/index"]
      : ["index", "index"];

    return {
      context: appRoot,
      entry: {
        [entryPair[0]]: path.join(cwdDirname, "src", entryPair[1]),
      },
      output: {
        // During webpack building, assets are written into
        // a temporary directory `dist-editors`.
        // And later to be merged into `dist/editors` during post-building.
        path: path.join(cwdDirname, isForEditors ? "dist-editors" : "dist"),
        publicPath: distPublicPath,
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
      optimization: {
        // In production mode, when using dynamic chunks, module ids and
        // chunk ids are numeric, and there maybe collisions among foreign
        // webpack bundles. So we use hashed module ids and named chunk ids.
        // !Edited:
        //   There maybe collisions among brick packages when using hashed
        //   module ids, too. So we use `BrickHashedModuleIdsPlugin` to prefix
        //   them with package names.
        namedChunks: true,

        ...(splitVendorsForLazyBricks
          ? null
          : {
              splitChunks: {
                cacheGroups: {
                  vendors: false,
                },
              },
            }),
      },
      module: {
        rules: [
          {
            test: /\.md$/,
            use: [
              {
                loader: "html-loader",
              },
              {
                loader: "markdown-loader",
                options: {
                  highlight,
                },
              },
            ],
          },
          {
            test: /\.js$/,
            enforce: "pre",
            use: ["source-map-loader"],
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
          {
            ...imageLoaderOptions,
            test: /\.svg$/,
            issuer: {
              test: /\.(ts|js)x?$/,
            },
            use: [
              {
                loader: "babel-loader",
                options: {
                  rootMode: "upward",
                },
              },
              {
                loader: "@svgr/webpack",
                options: {
                  babel: false,
                  svgoConfig: {
                    plugins: [
                      {
                        // Keep `viewbox`
                        removeViewBox: false,
                      },
                    ],
                  },
                },
              },
              ...imageLoaderOptions.use,
            ],
          },
          {
            test: /\.svg$/,
            issuer: {
              exclude: /\.(ts|js)x?$/,
            },
            ...imageLoaderOptions,
          },
          {
            test: /\.(woff(2)?|ttf|eot|svga)$/,
            use: [
              {
                loader: "file-loader",
                options: {
                  name: "assets/[name].[hash:8].[ext]",
                },
              },
            ],
          },
          {
            test: /\.(png|jpg)$/,
            ...imageLoaderOptions,
          },
          {
            test: /\.css$/,
            exclude: /\.(module|shadow|lazy)\.css$/,
            sideEffects: true,
            use: ["style-loader", ...getStyleLoaders()],
          },
          {
            test: /\.module\.css$/,
            use: [
              "style-loader",
              ...getStyleLoaders({
                modules: {
                  localIdentName: "[local]--[hash:base64:8]",
                },
              }),
            ],
          },
          {
            test: /\.shadow\.css$/,
            sideEffects: true,
            use: [
              "to-string-loader",
              ...getStyleLoaders({
                esModule: false,
              }),
            ],
          },
          {
            test: /\.lazy\.css$/,
            use: [
              {
                loader: "style-loader",
                options: {
                  injectType: "lazyStyleTag",
                },
              },
              ...getStyleLoaders(),
            ],
          },
          {
            test: /\.less$/,
            sideEffects: true,
            use: [
              "to-string-loader",
              getCssLoader({
                esModule: false,
              }),
              {
                loader: "less-loader",
                options: {
                  lessOptions: {
                    sourceMap: false,
                    javascriptEnabled: true,
                    plugins: [lessReplacePlugin],
                  },
                },
              },
            ],
          },
          {
            test: /\.html$/,
            use: "raw-loader",
          },
        ],
      },
      plugins: [
        isForEditors
          ? new ScanEditorBricksPlugin(packageName)
          : scope === "templates"
          ? new ScanTemplatesPlugin(packageName)
          : new ScanCustomElementsPlugin(
              packageName,
              dll.map((name) => name.substr("@next-dll/".length))
            ),
        ...(scope === "bricks" && !isForEditors
          ? // Avoid module id collisions among brick packages.
            [new BrickHashedModuleIdsPlugin({ packageName })]
          : []),
        new CleanWebpackPlugin(),
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
        ...(copyFiles && copyFiles.length > 0
          ? [
              new CopyPlugin({
                patterns: copyFiles.map((item) => ({
                  context: cwdDirname,
                  ...(typeof item === "string"
                    ? {
                        from: item,
                      }
                    : item),
                })),
              }),
            ]
          : []),
        ...(Array.isArray(ignores)
          ? ignores.map((item) => new webpack.IgnorePlugin(item))
          : []),
      ],
    };
  };
