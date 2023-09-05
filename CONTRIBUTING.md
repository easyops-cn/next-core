# Contribution Guide

## 开发调试

1. 运行 `yarn` 安装依赖
2. 如果项目初次运行或距上次生产构建时间较久，先执行一次全量生产构建 `yarn build`
3. 按需、按依赖启动相关包的开发构建，例如开发 runtime 代码时：
   - `npx lerna run start --scope @next-core/runtime`
   - `yarn start`（等同于启动 `@next-core/brick-container` 的开发构建）

关于 `yarn serve`：

- 在 v3 中，默认启用项目中所有本地 `node_modules` 中的构件包（`@next-bricks/*` 和 `@bricks/*`）；
- 如需禁用本地构件包，可指定 `--local-bricks=no`；
- 如需引用其他项目的构件包，可以使用 [`yarn link`](https://classic.yarnpkg.com/lang/en/docs/cli/link/)。
- 运行 `yarn serve --help` 查看帮助详情。

运行 `yarn start` 可启动开发模式的 brick-container 服务，其选项参数和 `yarn serve` 一致。

配置 `dev.config.mjs` 可引用其他仓库的构件包。

```js
// File: dev.config.mjs
export default {
  brickFolders: [
    // 默认使用 `node_modules/@next-bricks` 及 `node_modules/@bricks` 作为构件包文件夹。
    "node_modules/@next-bricks",
    "node_modules/@bricks",

    // 引用其他仓库的构件包。注：可使用通配符，详见 https://github.com/isaacs/node-glob
    "../next-*/bricks",
  ],
};
```

## Brick playground

运行 `yarn serve:playground` 可启动 brick-playground 服务。Playground 中的构件资源和示例来自项目中所有本地构件包。

运行 `yarn start:playground` 可启动开发模式的 brick-playground 服务。

## 从 v2 升级到 v3

V3 废弃了一些核心包，包括但不限于：

```bash
- brick-dll, dll/*
- brick-kit
- brick-utils
- rollup-config-factory
- webpack-config-factory
- build-config-factory
- jest-config-factory
- custom-antd-styles
- editor-bricks-helper
- fontawesome-library
- brick-types
- brick-http
```

新增了一些包，包括但不限于：

```bash
- runtime            # 相当于新的 brick-kit
- utils              # 相当于新的 brick-utils
- loader             # 构件资源文件加载器
- element            # 构件基础库，包括自定义元素基类和属性事件装饰器等
- react-element      # 基于 React 的构件基础库
- react-runtime      # 基于 React 的运行时，包括 UseBrick 等的实现
- brick-playground   # 用于开发调试构件（脱离核心框架）
- build-next-bricks  # 打包器，用于构件包、brick-container 和 brick-playground
- types              # 相当于新的 brick-types
- http               # 相当于新的 brick-http
```

同时 v3 也废弃了 `@next-libs/*`、`@next-sdk/*`（以及内网对应的 `@libs/*`、`@sdk/*`）。

对于 `@next-libs/*`，v3 中可以使用 `@next-shared/*` 进行平替。对于 `@next-sdk/*`，使用 `@next-api-sdk/*` 平替（内网同理）。
