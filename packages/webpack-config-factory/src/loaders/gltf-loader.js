// Forked from https://github.com/haversnail/gltf-loader/blob/0250dace59e330c16d41e432c60813373f747fbb/index.js
const path = require("path");
const loaderUtils = require("loader-utils");
const { normalizePath } = require("./utils");

const isObject = (value) => typeof value === "object" && value !== null;
const isDataURI = (value) => /^data:/i.test(value);

/**
 * A utility function that allows mapping the value for a given key in an object
 * [in place](https://en.wikipedia.org/wiki/In-place_algorithm).
 *
 * @remarks
 * This function recursively iterates through every key in the object.
 * Once a key strictly equal to the given key is found, the callback function
 * is invoked, and its return value (or resolved value) is then set as the new value
 * for that entry.
 *
 * @param {unknown} obj - The object to mutate.
 * @param {string} key - The key to match against.
 * @param {(value: unknown) => Promise<any>} callback
 * The callback that either returns the mapped value, or returns a Promise
 * that resolves to the new value.
 */
async function mapDeep(obj, key, callback) {
  if (Array.isArray(obj)) {
    for (const item of obj) {
      await mapDeep(item, key, callback);
    }
  } else if (isObject(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      if (k === key) {
        obj[k] = await callback(v);
      } else {
        await mapDeep(v, key, callback);
      }
    }
  }
}

async function gltfLoader(content) {
  this.cacheable(false);

  const name = "assets/[name].[contenthash:8].[ext]";

  const data = JSON.parse(content);

  // Iterate over the object and map any URIs:
  await mapDeep(data, "uri", async (uri) => {
    // Resolve early if the URI cannot be imported as a module:
    if (!loaderUtils.isUrlRequest(uri)) return uri;

    if (isDataURI(uri)) {
      this.emitWarning(
        // prettier-ignore
        new Error(
            "Detected a data URI attempting to load a glTF file.\n\n" +
            "Prefer using local or remote URIs instead for better performance on the web. " +
            "If you want to use self-contained files, consider using the `.glb` format."
          )
      );
      return uri;
    }

    // Get the asset's path as a relative module path:
    const request = loaderUtils.urlToRequest(uri, this.context);
    const extraAssetUri = await new Promise((resolve, reject) => {
      // Import the asset as a module (this ensures the files are loaded by their respective loaders):
      this.loadModule(request, (err, source, sourceMap, module) => {
        if (err) {
          reject(err);
          return;
        }
        if (!module.buildInfo.assetsInfo) {
          reject("no assetsInfo");
          return;
        }
        const assets = [...module.buildInfo.assetsInfo.keys()];
        if (assets.length !== 1) {
          reject(
            `Unexpected assets: ${assets.join(", ")}. Issued by: "${uri}"`
          );
          return;
        }
        resolve(assets[0]);
      });
    });

    return path.relative(path.dirname(name), extraAssetUri);
  });

  const updatedContent = JSON.stringify(data);
  const outputPath = loaderUtils.interpolateName(this, name, {
    content: updatedContent,
  });
  const sourceFilename = normalizePath(
    path.relative(this.rootContext, this.resourcePath)
  );
  this.emitFile(outputPath, updatedContent, null, {
    immutable: true,
    sourceFilename,
  });

  return `export default __webpack_public_path__ + ${JSON.stringify(
    outputPath
  )}`;
}

module.exports = gltfLoader;
