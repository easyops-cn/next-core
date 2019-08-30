const path = require("path");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const prism = require("prismjs");
const loadLanguages = require("prismjs/components/index");
const ScanCustomElementsPlugin = require("./ScanCustomElementsPlugin");

const getStyleLoaders = cssOptions => [
  {
    loader: "css-loader",
    options: cssOptions
  },
  {
    loader: "postcss-loader",
    options: {
      ident: "postcss",
      plugins: () => [
        require("postcss-nested")(),
        require("postcss-preset-env")()
      ]
    }
  }
];

loadLanguages(["ts", "tsx", "json"]);

const highlight = (code, lang) => {
  const grammar = prism.languages[lang];
  if (grammar) {
    return prism.highlight(code, grammar, lang);
  }
  return code;
};

const getImageLoaderOptions = distPublicPath => ({
  exclude: /node_modules/,
  use: [
    {
      loader: "url-loader",
      options: {
        name: "assets/[name].[hash:8].[ext]",
        limit: 8192,
        publicPath: distPublicPath
      }
    }
  ]
});

module.exports = ({ useToStringLoaderInsteadOfStyleLoader, dll = [] } = {}) => {
  const dirname = process.cwd();
  const appRoot = path.join(dirname, "..", "..");
  const pkgRelativeRoot = path.relative(appRoot, dirname);
  const distPublicPath = pkgRelativeRoot
    .split(path.sep)
    .concat("dist")
    .join("/");
  const imageLoaderOptions = getImageLoaderOptions(distPublicPath);
  return {
    context: appRoot,
    entry: path.join(dirname, "src", "index"),
    output: {
      path: path.join(dirname, "dist")
      // publicPath: "/"
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
      symlinks: false
    },
    module: {
      rules: [
        {
          test: /\.md$/,
          use: [
            {
              loader: "html-loader"
            },
            {
              loader: "markdown-loader",
              options: {
                highlight
              }
            }
          ]
        },
        {
          // Include ts, tsx, js, and jsx files.
          test: /\.(ts|js)x?$/,
          exclude: /node_modules/,
          loader: "babel-loader",
          options: {
            rootMode: "upward"
          }
        },
        {
          ...imageLoaderOptions,
          test: /\.svg$/,
          issuer: {
            test: /\.(ts|js)x?$/
          },
          use: [
            {
              loader: "babel-loader",
              options: {
                rootMode: "upward"
              }
            },
            {
              loader: "@svgr/webpack",
              options: {
                babel: false
              }
            },
            ...imageLoaderOptions.use
          ]
        },
        {
          test: /\.svg$/,
          issuer: {
            exclude: /\.(ts|js)x?$/
          },
          ...imageLoaderOptions
        },
        {
          test: /\.(png|jpg)$/,
          ...imageLoaderOptions
        },
        {
          test: /\.css$/,
          exclude: /\.(module|shadow)\.css$/,
          sideEffects: true,
          use: [
            useToStringLoaderInsteadOfStyleLoader
              ? "to-string-loader"
              : "style-loader",
            ...getStyleLoaders({
              importLoaders: 1
            })
          ]
        },
        {
          test: /\.module\.css$/,
          use: [
            "style-loader",
            ...getStyleLoaders({
              importLoaders: 1,
              modules: {
                localIdentName: "[local]--[hash:base64:8]"
              }
            })
          ]
        },
        {
          test: /\.shadow\.css$/,
          sideEffects: true,
          use: [
            "to-string-loader",
            ...getStyleLoaders({
              importLoaders: 1
            })
          ]
        },
        {
          test: /\.html$/,
          use: "raw-loader"
        }
      ]
    },
    plugins: [
      new ScanCustomElementsPlugin(dll),
      new CleanWebpackPlugin(),
      new webpack.DllReferencePlugin({
        context: appRoot,
        manifest: require("@easyops/brick-dll")
      }),
      ...dll.map(
        name =>
          new webpack.DllReferencePlugin({
            context: appRoot,
            manifest: require(`@dll/${name}`)
          })
      )
    ]
  };
};
