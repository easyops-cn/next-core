const path = require("path");
const { babel } = require("@rollup/plugin-babel");
const { nodeResolve } = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");
const postcss = require("rollup-plugin-postcss");
const url = require("@rollup/plugin-url");
const image = require("@rollup/plugin-image");
const copy = require("rollup-plugin-copy");
const postcssNested = require("postcss-nested");
const stringHash = require("string-hash");

exports.rollupPlugins = {
  babel,
  nodeResolve,
  commonjs,
  json,
  url,
  image,
  copy,
};

exports.rollupFactory = ({
  umdName,
  plugins = [],
  disableUmd,
  disableEsm,
  copyFiles = [],
  babelExclude,
}) => {
  const packageJson = require(path.join(process.cwd(), "package.json"));
  // Find peer dependencies include:
  //   dependencies of dll peerDependencies;
  //   other peerDependencies.
  const peerDependencies = Object.keys(packageJson.peerDependencies || {});
  const external = new Set();
  const dllNames = [
    // Internal:
    "@easyops/brick-dll",
    /^@dll\//,

    // Public:
    "@next-core/brick-dll",
    /^@next-dll\//,
  ];
  peerDependencies.forEach((dep) => {
    if (
      dllNames.some((name) =>
        typeof name === "string" ? name === dep : name.test(dep)
      )
    ) {
      const dllJson = require(require.resolve(`${dep}/package.json`));
      Object.keys(dllJson.dependencies).forEach((dllDep) => {
        external.add(dllDep);
      });
    } else {
      external.add(dep);
    }
  });

  for (const ext of external) {
    if (ext.startsWith("@next-core/")) {
      external.add(ext.replace("@next-core/", "@easyops/"));
    }
  }

  // By default, rollup-plugin-postcss use filename hash instead of content hash.
  function generateScopedName(name, filename, css) {
    const hash = stringHash(css).toString(36).substr(0, 8);
    const file = path.basename(filename, ".module.css");

    return `${file}--${name}--${hash}`;
  }

  return {
    input: "src/index.ts",
    output: [
      {
        dir: "dist",
        entryFileNames: "index.bundle.js",
        format: "umd",
        name: umdName,
        sourcemap: true,
        exports: "named",
      },
      {
        dir: "dist",
        entryFileNames: "index.esm.js",
        format: "esm",
        sourcemap: true,
        exports: "named",
      },
    ].filter(
      (item) =>
        !(
          (disableUmd && item.format === "umd") ||
          (disableEsm && item.format === "esm")
        )
    ),
    external: Array.from(external.add(/@babel\/runtime/)),
    plugins: [
      ...plugins,
      ...(copyFiles.length > 0
        ? [
            copy({
              targets: copyFiles,
            }),
          ]
        : []),
      nodeResolve({
        browser: true,
        extensions: [".mjs", ".js", ".jsx", ".json", ".ts", ".tsx"],
      }),
      postcss({
        modules: {
          generateScopedName,
        },
        plugins: [postcssNested()],
      }),
      json(),
      commonjs(),
      babel({
        exclude: babelExclude,
        configFile: "../../babel.config.js",
        extensions: ["js", "jsx", "ts", "tsx"],
        babelHelpers: "runtime",
      }),
    ],
  };
};

function getCommonPlugins() {
  return [
    nodeResolve({
      extensions: [".ts"],
    }),
    babel({
      configFile: "../../babel.config.js",
      extensions: ["ts"],
      babelHelpers: "runtime",
    }),
  ];
}

exports.rollupFactoryForSnippets = () => ({
  input: "snippets/index.ts",
  output: {
    file: "dist-snippets/index.js",
    format: "cjs",
  },
  plugins: [...getCommonPlugins(), image()],
});

exports.rollupFactoryForStories = () => ({
  input: "stories/index.ts",
  output: {
    file: "dist/stories/index.js",
    format: "cjs",
  },
  plugins: [
    ...getCommonPlugins(),
    url({
      limit: 1024,
      destDir: "dist/stories-asserts",
      fileName: "[name].[hash][extname]",
      publicPath: `bricks/${path.basename(
        process.cwd()
      )}/dist/stories-asserts/`,
    }),
  ],
});
