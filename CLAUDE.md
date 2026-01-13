# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Brick Next 是一个基于 Web Components 的低代码引擎库,用于构建高度插件化、高度可配置化的企业用户界面解决方案。项目采用 monorepo 架构,使用 Lerna + Yarn Workspaces 管理多个包。

## 开发环境

- **Node.js**: >= 16
- **包管理器**: Yarn 1.22.19 (通过 `yarn` 安装依赖)
- **主分支**: `v3`
- **架构**: Lerna monorepo,包含 `packages/*` 和 `bricks/*` 两类工作空间

## 常用命令

### 安装与构建

```bash
# 安装依赖
yarn

# 全量生产构建(首次运行或距上次构建时间较久时需要)
yarn build

# 构建单个包
npx lerna run build --scope @next-core/runtime
```

### 开发调试

```bash
# 启动 brick-container 开发服务(默认启用本地所有构件包)
yarn start
# 或
yarn serve

# 启动单个包的开发构建(按需启动相关依赖包)
npx lerna run start --scope @next-core/runtime

# 禁用本地构件包
yarn serve --local-bricks=no

# 启动 brick-playground 服务
yarn serve:playground
# 开发模式
yarn start:playground
```

### 测试

```bash
# 运行所有测试
yarn test

# CI 模式运行所有测试
yarn test:ci

# 运行单个包的测试
npx lerna run test --scope @next-core/runtime

# E2E 测试
yarn cypress:open              # 打开 Cypress UI
yarn test:e2e:no-record       # 运行 E2E 测试(不记录)
yarn test:e2e:ci              # CI 模式运行 E2E 测试
```

### 代码质量

```bash
# Lint(通过 husky + lint-staged 在提交时自动运行)
yarn lint-staged
```

## 核心架构

### V3 核心包结构

项目从 v2 升级到 v3,引入了新的包结构:

#### 运行时核心

- **`@next-core/runtime`**: 核心运行时库,相当于 v2 的 brick-kit,负责解析 storyboard 和装载构件
- **`@next-core/loader`**: 构件资源文件加载器
- **`@next-core/react-runtime`**: 基于 React 的运行时,包括 UseBrick 等的实现

#### 构件开发基础

- **`@next-core/element`**: 构件基础库,提供自定义元素基类和属性事件装饰器
- **`@next-core/react-element`**: 基于 React 的构件基础库

#### 工具库

- **`@next-core/utils`**: 工具函数库,相当于 v2 的 brick-utils
- **`@next-core/types`**: 类型定义,相当于 v2 的 brick-types
- **`@next-core/http`**: HTTP 请求库,相当于 v2 的 brick-http
- **`@next-core/i18n`**: 国际化支持
- **`@next-core/cook`**: 数据处理和转换
- **`@next-core/inject`**: 依赖注入
- **`@next-core/supply`**: 供给管理
- **`@next-core/pipes`**: 管道函数

#### 开发工具

- **`@next-core/build-next-bricks`**: 构件包打包工具
- **`@next-core/build-next-libs`**: 库打包工具
- **`@next-core/test-next`**: 测试工具(基于 Jest 30)
- **`@next-core/brick-container`**: 构件容器,用于运行微应用
- **`@next-core/brick-playground`**: 构件开发调试工具(脱离核心框架)

#### 已废弃的 V2 包

- `brick-dll`, `brick-kit`, `brick-utils`, `rollup-config-factory`, `webpack-config-factory`
- `@next-libs/*` → 使用 `@next-shared/*` 替代
- `@next-sdk/*` → 使用 `@next-api-sdk/*` 替代

### 项目结构

```
next-core-v3/
├── packages/          # 核心包和工具库
│   ├── runtime/       # 核心运行时
│   ├── element/       # 构件基础库
│   ├── react-element/ # React 构件基础库
│   ├── build-next-bricks/  # 构件打包工具
│   └── ...
├── bricks/            # 构件包
│   └── e2e/           # E2E 测试用构件
├── cypress/           # E2E 测试配置和用例
├── dev.config.mjs     # 开发环境配置
└── conf.yaml          # 覆盖远端配置(可选)
```

### 开发配置

#### dev.config.mjs

可以配置引用其他仓库的构件包、特性开关、微应用配置、API mocks 等:

```javascript
export default {
  brickFolders: [
    "node_modules/@next-bricks",
    "../next-*/bricks", // 引用其他仓库
  ],
  settings: {
    featureFlags: { "my-flag": true },
    misc: { myMisc: "anything" },
  },
  userConfigByApps: {
    "my-app-id": { myAnyAppConfig: "anything" },
  },
  mocks: [
    (req, res, next) => {
      /* ... */
    },
  ],
};
```

#### conf.yaml

覆盖远端配置(特性开关、杂项配置、微应用配置)

### 包的开发构建流程

单个包的开发构建通常包含两个并发任务:

1. 类型声明文件生成 (TypeScript watch 模式)
2. 主文件构建 (使用 `build-next-libs` 或 `build-next-bricks`)

### 依赖关系

- 构件包 (`@next-bricks/*`) 依赖 `@next-core/element` 或 `@next-core/react-element`
- 开发时需要按依赖顺序启动相关包的开发构建
- 使用 `yarn link` 可以引用其他项目的构件包

## 注意事项

1. **初次开发或长时间未构建**: 先执行 `yarn build` 进行全量构建
2. **按需启动依赖**: 开发某个包时,需要同时启动其依赖包的开发构建
3. **构件包加载**: 默认启用 `node_modules` 中的所有本地构件包
4. **测试框架**: 使用 Jest 30,通过 `test-next` 和 `test-next-project` 命令运行
5. **React 版本**: 使用实验性版本 `0.0.0-experimental-ee8509801-20230117`
