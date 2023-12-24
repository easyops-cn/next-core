import webpack from "webpack";
import path from "path";
import { createRequire } from "module";
import { existsSync } from "node:fs";
import { writeFile, rm } from "node:fs/promises";

const require = createRequire(import.meta.url);

function getBuildStoriesWebpackConfig(packageDir, storiesPath) {
  const outputPath = path.join(packageDir, "dist");

  return {
    entry: storiesPath,
    output: {
      publicPath: `bricks/${path.basename(packageDir)}/dist/`,
      path: outputPath,
      filename: `stories.cjs`,
      library: {
        type: "commonjs",
        export: "default",
      },
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
      extensionAlias: {
        ".js": [".ts", ".tsx", ".js", ".jsx"],
      },
    },
    module: {
      rules: [
        {
          test: /\.ts?$/,
          loader: "babel-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.svg$/i,
          type: "asset/resource",
          generator: {
            filename: "stories-assets/[name].[contenthash][ext]",
          },
        },
      ],
    },
    devtool: false,
  };
}
/**
 * @param {string} packageDir
 * @returns {Promise<void>}
 */
const buildStories = async (packageDir) => {
  const storiesPath = path.join(packageDir, "stories");
  if (existsSync(storiesPath)) {
    const compiler = await webpack(
      await getBuildStoriesWebpackConfig(packageDir, storiesPath)
    );
    await new Promise((resolve, reject) => {
      compiler.run((err, stats) => {
        if (err || stats.hasErrors()) {
          console.error("Failed to build stories:");
          reject(err || stats.toString());
        } else {
          resolve();
        }
      });
    });

    const transformStoriesPath = path.join(packageDir, "dist/stories.cjs");

    if (existsSync(transformStoriesPath)) {
      const result = require(transformStoriesPath);

      const stories = Object.values(result);
      if (stories.length) {
        const distDir = path.join(packageDir, "dist");

        await writeFile(
          path.join(distDir, "stories.json"),
          JSON.stringify(stories, null, 2)
        );
      }

      await rm(transformStoriesPath);
      console.log("Build stories done");
    }
  }
};

export default buildStories;
