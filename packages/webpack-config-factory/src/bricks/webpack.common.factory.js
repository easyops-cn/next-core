const path = require("path");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const prism = require("prismjs");
const loadLanguages = require("prismjs/components/index");
const ScanCustomElementsPlugin = require("./ScanCustomElementsPlugin");
const ScanTemplatesPlugin = require("./ScanTemplatesPlugin");

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

const getWorkerLoaders = (distPublicPath, options) => [
  {
    loader: "worker-loader",
    options: {
      publicPath: `${distPublicPath}/`,
      ...options,
    },
  },
  {
    loader: "babel-loader",
    options: {
      rootMode: "upward",
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

const getImageLoaderOptions = (distPublicPath) => ({
  use: [
    {
      loader: "url-loader",
      options: {
        name: "assets/[name].[hash:8].[ext]",
        limit: 8192,
        publicPath: distPublicPath,
        esModule: false,
      },
    },
  ],
});

module.exports = ({ scope = "bricks", copyFiles = [], ignores = [] } = {}) => {
  const cwdDirname = process.cwd();
  const appRoot = path.join(cwdDirname, "..", "..");
  const pkgRelativeRoot = path.relative(appRoot, cwdDirname);
  const distPublicPath = pkgRelativeRoot
    .split(path.sep)
    .concat("dist")
    .join("/");
  const imageLoaderOptions = getImageLoaderOptions(distPublicPath);

  const packageJson = require(path.join(cwdDirname, "package.json"));
  const packageName = packageJson.name.split("/")[1];
  const dll = Object.keys(packageJson.peerDependencies || {}).filter((name) =>
    name.startsWith("@dll/")
  );

  return {
    context: appRoot,
    entry: path.join(cwdDirname, "src", "index"),
    output: {
      path: path.join(cwdDirname, "dist"),
      // publicPath: "/"
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
      symlinks: false,
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
          // For inline web workers.
          // Small workers should use inline.
          test: /\.inline\.worker\.(ts|js)x?$/,
          exclude: /node_modules/,
          use: getWorkerLoaders(distPublicPath, { inline: true }),
        },
        {
          // For web workers.
          // Large workers should not use inline.
          test: /\.worker\.(ts|js)x?$/,
          exclude: /node_modules|\.inline\.worker\./,
          use: getWorkerLoaders(distPublicPath),
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
          test: /\.(woff(2)?|ttf|eot)$/,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "assets/[name].[hash:8].[ext]",
                publicPath: distPublicPath,
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
          exclude: /\.(module|shadow)\.css$/,
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
          use: ["to-string-loader", ...getStyleLoaders()],
        },
        {
          test: /\.less$/,
          sideEffects: true,
          use: [
            "to-string-loader",
            getCssLoader(),
            {
              loader: "less-loader",
              options: {
                lessOptions: {
                  sourceMap: false,
                  javascriptEnabled: true,
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
      scope === "templates"
        ? new ScanTemplatesPlugin(packageName)
        : new ScanCustomElementsPlugin(
            packageName,
            dll.map((name) => name.substr("@dll/".length))
          ),
      new CleanWebpackPlugin(),
      new webpack.DllReferencePlugin({
        context: appRoot,
        // 解决该包在 `npm link` 下引用到错误的包路径的问题
        manifest: require(require.resolve("@easyops/brick-dll", {
          paths: [cwdDirname],
        })),
      }),
      ...dll.map(
        (name) =>
          new webpack.DllReferencePlugin({
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
