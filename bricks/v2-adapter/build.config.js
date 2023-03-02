// @ts-check
import path from "node:path";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import CopyPlugin from "copy-webpack-plugin";
import webpack from "webpack";
import packageJson from "./package.json" assert { type: "json" };

const require = createRequire(import.meta.url);

const mainDll = "@next-core/brick-dll-v3";

/**
 * @param packageName {string}
 * @param regExp {RegExp}
 * @returns string | undefined
 */
function getDllJsName(packageName, regExp) {
  const jsFile = readdirSync(
    path.join(require.resolve(`${packageName}/package.json`), "../dist"),
    {
      withFileTypes: true,
    }
  ).find((dirent) => dirent.isFile() && regExp.test(dirent.name));
  if (!jsFile) {
    throw new Error(`Dll js not found: ${packageName}`);
  }
  return jsFile.name;
}

// Find all `@next-dll/*`.
const dll = Object.keys(packageJson.devDependencies)
  .filter((packageName) => packageName.startsWith("@next-dll/"))
  .map((packageName) => {
    const dllName = packageName.split("/").slice(-1)[0];
    return {
      packageName,
      dllName,
      jsName: getDllJsName(packageName, /^dll-of-[-\w]+\.\w+\.js$/),
    };
  });

const thisPackageName = packageJson.name.split("/")[1];
const dllPublicPath = `bricks/${thisPackageName}/dist/dll/`;
const dllPublicPathWithVersion = `bricks/${thisPackageName}/${packageJson.version}/dist/dll/`;

/** @type {import("@next-core/build-next-bricks").BuildNextBricksConfig} */
export default {
  extractCss: true,
  plugins: [
    new CopyPlugin({
      patterns: [
        path.join(require.resolve(`${mainDll}/package.json`), "../dist/*.js"),
      ]
        .flatMap((filePath) => [filePath, `${filePath}.map`])
        .map((from) => ({
          from,
          to: "dll/[name][ext]",
          transform: /\.js$/.test(from)
            ? (content, absoluteFrom) => {
                if (!/dll\.[^.]+\.js$/.test(absoluteFrom)) {
                  return content;
                }
                const space = absoluteFrom.endsWith("dll.bundle.js") ? " " : "";
                return content
                  .toString()
                  .replace(
                    `.p${space}=${space}"__DLL_PUBLIC_PATH__"`,
                    `.p=(window.PUBLIC_ROOT||"")+(window.PUBLIC_ROOT_WITH_VERSION?${JSON.stringify(
                      dllPublicPathWithVersion
                    )}:${JSON.stringify(dllPublicPath)})`
                  );
              }
            : undefined,
        })),
    }),
    new CopyPlugin({
      patterns: dll
        .map((d) => d.packageName)
        .map((packageName) =>
          path.join(
            require.resolve(`${packageName}/package.json`),
            "../dist/*.js"
          )
        )
        .flatMap((filePath) => [filePath, `${filePath}.map`])
        .map((from) => ({
          from,
          to: "dll/[name][ext]",
        })),
    }),
    new webpack.DefinePlugin({
      // Recording dll js path which contains hash for long-term-caching.
      DLL_PATH: JSON.stringify(
        Object.fromEntries(
          [["", getDllJsName(mainDll, /^dll\.\w+\.js$/)]].concat(
            dll.map(({ dllName, jsName }) => [dllName, jsName])
          )
        )
      ),
    }),
  ],
};
