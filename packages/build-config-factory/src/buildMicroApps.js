const path = require("path");
const fs = require("fs");
const meow = require("meow");
const prettier = require("prettier");
const chokidar = require("chokidar");
const { throttle } = require("lodash");

module.exports = function buildMicroApps() {
  const dirname = process.cwd();
  const distPath = path.join(dirname, "dist");
  const indexJsPath = path.join(distPath, "index.js");
  const storyboardJsonPath = path.join(dirname, "storyboard.json");

  function requireUncached(module, moduleDir) {
    delete require.cache[require.resolve(module)];
    for (const key of Object.keys(require.cache)) {
      // Delete all subdir module caches.
      if (key.startsWith(moduleDir)) {
        delete require.cache[key];
      }
    }
    return require(module);
  }

  function writeStoryboard(json) {
    const content = JSON.stringify(json, null, 2);
    fs.writeFileSync(
      storyboardJsonPath,
      prettier.format(content, {
        parser: "json"
      })
    );
    console.log("File Updated: ./storyboard.json");
  }

  const { flags } = meow({
    flags: {
      watch: {
        type: "boolean",
        alias: "w"
      }
    }
  });

  if (fs.existsSync(indexJsPath)) {
    const storyboard = require(indexJsPath).default;
    writeStoryboard(storyboard);
  } else if (!flags.watch) {
    console.error("File not found:", indexJsPath);
  }

  if (flags.watch) {
    console.log("Watching...");
    // Always use posix separator for `chokidar.watch`.
    const files = path.posix.join(
      distPath.split(path.sep).join("/"),
      "**/*.js"
    );
    const onChange = () => {
      if (fs.existsSync(indexJsPath)) {
        const storyboard = requireUncached(indexJsPath, distPath + path.sep)
          .default;
        writeStoryboard(storyboard);
      }
    };
    // Throttle for every 100 milliseconds a time.
    const throttledOnChange = throttle(onChange, 100, { trailing: false });
    chokidar.watch(files, { ignoreInitial: true }).on("all", throttledOnChange);
  }
};
