// Ref https://babeljs.io/docs/en/presets#creating-a-preset
const presetEnv = require("@babel/preset-env");
const presetReact = require("@babel/preset-react");
const presetTypescript = require("@babel/preset-typescript");
const proposalDecorators = require("@babel/plugin-proposal-decorators");
const transformRuntime = require("@babel/plugin-transform-runtime");

module.exports = () => {
  const envFactory = (env) => ({
    presets: [
      [
        presetEnv,
        env === "test"
          ? {
              targets: {
                node: "current",
              },
            }
          : env === "commonjs"
          ? {
              targets: {
                node: "12",
              },
            }
          : {
              modules: false,
              useBuiltIns: "entry",
              corejs: {
                version: "3.29",
              },
            },
      ],
      presetReact,
      [
        presetTypescript,
        {
          allowDeclareFields: true,
        },
      ],
    ],
    plugins: [
      [
        proposalDecorators,
        {
          version: "2022-03",
        },
      ],
      [
        transformRuntime,
        {
          // https://github.com/babel/babel/issues/9454#issuecomment-460425922
          version: "7.20.13",
        },
      ],
    ],
  });

  return {
    env: Object.fromEntries(
      ["test", "development", "production", "commonjs"].map((env) => [
        env,
        envFactory(env),
      ])
    ),
  };
};
