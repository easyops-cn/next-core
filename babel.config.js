module.exports = {
  babelrcRoots: [
    // Keep the root as a root
    ".",

    // Also consider monorepo packages "root" and load their .babelrc files.
    "./packages/*"
  ],
  env: {
    test: {
      presets: [
        [
          "@babel/preset-env",
          {
            targets: {
              node: "current"
            }
          }
        ],
        "@babel/preset-react",
        "@babel/preset-typescript"
      ],
      plugins: [
        [
          "babel-plugin-import",
          {
            libraryName: "antd"
          }
        ],
        [
          "@babel/plugin-proposal-decorators",
          {
            legacy: true
          }
        ],
        [
          "@babel/plugin-proposal-class-properties",
          {
            loose: true
          }
        ]
      ]
    },
    development: {
      presets: [
        [
          "@babel/preset-env",
          {
            modules: false,
            useBuiltIns: "entry",
            corejs: {
              version: 3
            }
          }
        ],
        "@babel/preset-react",
        "@babel/preset-typescript"
      ],
      plugins: [
        [
          "@babel/plugin-proposal-decorators",
          {
            legacy: true
          }
        ],
        [
          "@babel/plugin-proposal-class-properties",
          {
            loose: true
          }
        ]
      ]
    },
    production: {
      presets: [
        [
          "@babel/preset-env",
          {
            modules: false,
            useBuiltIns: "entry",
            corejs: {
              version: 3
            }
          }
        ],
        "@babel/preset-react",
        "@babel/preset-typescript"
      ],
      plugins: [
        [
          "@babel/plugin-proposal-decorators",
          {
            legacy: true
          }
        ],
        [
          "@babel/plugin-proposal-class-properties",
          {
            loose: true
          }
        ]
      ]
    }
  }
};
