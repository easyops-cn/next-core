module.exports = {
  // Ref https://babeljs.io/docs/en/options#babelrcroots
  babelrcRoots: [
    // Keep the root as a root
    ".",

    // Also consider monorepo packages "root" and load their .babelrc files.
    "./packages/*"
  ],
  presets: ["@easyops/babel-preset-next"]
};
