const path = require("path");
const babel = require("rollup-plugin-babel");
const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const json = require("rollup-plugin-json");
const replace = require("rollup-plugin-replace");
const postcss = require("rollup-plugin-postcss");
const packageJson = require(path.join(process.cwd(), "package.json"));

// Find peer dependencies include:
//   dependencies of dll peerDependencies;
//   other peerDependencies.
const peerDependencies = Object.keys(packageJson.peerDependencies || {});
const external = new Set();
const dllNames = ["@easyops/brick-dll", /^@dll\//];
peerDependencies.forEach(dep => {
  if (
    dllNames.some(name =>
      typeof name === "string" ? name === dep : name.test(dep)
    )
  ) {
    const dllJson = require(require.resolve(`${dep}/package.json`));
    Object.keys(dllJson.dependencies).forEach(dllDep => {
      external.add(dllDep);
    });
  } else {
    external.add(dep);
  }
});

exports.rollupFactory = ({ umdName, plugins = [] }) => ({
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.bundle.js",
      format: "umd",
      name: umdName,
      sourcemap: true,
      exports: "named"
    },
    {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: true,
      exports: "named"
    }
  ],
  external: Array.from(external),
  plugins: [
    ...plugins,
    replace({
      "process.env.NODE_ENV": process.env.NODE_ENV
    }),
    resolve({
      browser: true,
      extensions: [".mjs", ".js", ".jsx", ".json", ".ts", ".tsx"]
    }),
    postcss({
      modules: true
    }),
    json(),
    commonjs(),
    babel({
      // exclude: "node_modules/**",
      configFile: "../../babel.config.js",
      extensions: ["js", "jsx", "ts", "tsx"]
    })
  ]
});
