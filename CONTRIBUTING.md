# Contribution Guide

## 开发调试

```bash
yarn
yarn build
yarn serve
```

关于 `yarn serve`：

- 在 v3 中，默认启用项目中所有本地 `node_modules` 中的构件包（`@next-bricks/*` 和 `@bricks/*`）；
- 如需禁用本地构件包，可指定 `--local-bricks=no`；
- 如需引用其他项目的构件包，可以使用 [`yarn link`](https://classic.yarnpkg.com/lang/en/docs/cli/link/)。
- 运行 `yarn serve --help` 查看帮助详情。

运行 `yarn start` 可启动开发模式的 brick-container 服务，其选项参数和 `yarn serve` 一致。

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
