// @ts-check
import path from "node:path";
import { createRequire } from "node:module";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import webpack from "webpack";
import packageJson from "./package.json" assert { type: "json" };

const require = createRequire(import.meta.url);

const packageDir = process.cwd();

const coreRootPlaceholder = "<!--# echo var='core_root' default='' -->";
const faviconPath = `${coreRootPlaceholder}assets/favicon.png`;
const baseHref = "<!--# echo var='base_href' default='/' -->";
const mockDate = "<!--# echo var='mock_date' default='' -->";
const publicCdn = "<!--# echo var='public_cdn' default='' -->";

/** @type {import("@next-core/build-next-bricks").BuildNextBricksConfig} */
export default {
  type: "container",
  entry: {
    main: "./src/index",
    polyfill: "./src/polyfill",
  },
  extractCss: true,
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      title: "DevOps 管理专家",
      template: path.join(packageDir, "src/index.ejs"),
      baseHref,
      faviconPath,
      // We want to use a nginx ssi expression as the `publicPath`,
      // but currently HtmlWebpackPlugin will auto append a trailing slash
      // for it, which would break our tags.
      // See https://github.com/jantimon/html-webpack-plugin/issues/1701
      inject: false,
      mockDate,
      publicCdn,
      customizeTag(tag) {
        if (tag.tagName === "link" && tag.attributes.rel === "stylesheet") {
          return {
            ...tag,
            attributes: {
              ...tag.attributes,
              href: `${coreRootPlaceholder}${tag.attributes.href}`,
            },
          };
        }
        if (tag.tagName === "script") {
          return {
            ...tag,
            attributes: {
              ...tag.attributes,
              src: `${coreRootPlaceholder}${tag.attributes.src}`,
            },
          };
        }
        return tag;
      },
    }),
    new HtmlWebpackPlugin({
      filename: "browse-happy.html",
      title: "DevOps 管理专家",
      template: path.join(packageDir, "src/browse-happy.ejs"),
      chunks: [],
      baseHref,
      faviconPath,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.join(packageDir, "assets"),
          to: "assets",
        },
        {
          from: path.join(
            require.resolve("@next-core/preview/package.json"),
            "../dist"
          ),
          to: "preview",
          transform(buf, filePath) {
            if (
              filePath ===
              path.join(
                require.resolve("@next-core/preview/package.json"),
                "../dist",
                "index.html"
              )
            ) {
              return buf
                .toString()
                .replace("BASE_HREF", "/next/")
                .replace("./bootstrap.hash.json", "../api/auth/v2/bootstrap");
            }
            return buf;
          },
        },
      ],
    }),
    new webpack.DefinePlugin({
      BRICK_NEXT_VERSIONS: JSON.stringify({
        ["brick-container"]: packageJson.version,
      }),
    }),
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
          name: "vendors",
        },
        core: {
          // Make it compatible with EasyOps CI.
          test: /[\\/](?:next-core|data[\\/]easyops)[\\/](?:packages|sdk)[\\/](?!theme[\\/])/,
          priority: -10,
          reuseExistingChunk: true,
          name: "core",
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
};
