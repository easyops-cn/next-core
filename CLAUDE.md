# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Easy Bricks Core 是一个企业级低代码前端框架的核心库,基于 Lerna + Yarn Workspace 的 Monorepo 架构。该框架通过 Web Components (构件) 和 Storyboard 配置来构建可插拔、可配置的微应用系统。

- **仓库**: https://github.com/easyops-cn/next-core
- **许可证**: GPL-3.0
- **Node 版本**: 14.x (见 .nvmrc)

## 架构概述

### Monorepo 结构

```
next-core/
├── packages/*    # 59个核心包 (@next-core/*)
├── dll/*         # 7个预编译DLL包 (@next-dll/*)
└── v3/*          # 13个V3兼容包 (向后兼容)
```

### 核心依赖关系

```
brick-container
  ↓
brick-dll
  ↓
brick-kit → brick-utils → brick-types
           → brick-http
           → cook
           → supply
```

### 关键包说明

- **brick-container**: Express 服务器,负责微应用容器托管
- **brick-kit**: 核心运行时内核
- **brick-dll**: 供应商 DLL 预编译库
- **brick-utils**: 工具函数库
- **brick-types**: TypeScript 类型定义
- **storyboard**: Storyboard 解析器
- **cook**: 表达式和函数处理器
- **jest-config-factory**: Jest 配置工厂,提供 `next-jest` CLI
- **brick-scripts**: 构件开发脚本工具

## 常用命令

### 安装和初始化

```bash
yarn                    # 安装依赖
yarn prepare            # bootstrap + husky install
```

### 开发

```bash
yarn start              # 启动开发服务器 (brick-container)
yarn serve              # 本地服务 (不使用 mock)
```

**开发环境配置**: 默认使用 `../next-basics` 作为构件仓库。可在根目录创建 `dev.config.js` 自定义:

```js
const path = require("path");
exports.nextRepoDir = path.join(__dirname, "../your-bricks-repo");
```

**环境变量**: 可通过环境变量传递 serve 参数:

- `SUBDIR=true` 等于 `--subdir`
- `LOCAL_BRICKS=abc,xyz` 等于 `--local-bricks=abc,xyz`
- `LOCAL_APPS=abc,xyz` 等于 `--local-apps=abc,xyz`

### 调试本地核心包

如果需要调试 brick-dll 依赖的包 (如 brick-kit, brick-utils),需要按依赖顺序在三个终端分别运行:

```bash
# Terminal 1: 启动被依赖的包
lerna run start --scope @next-core/brick-kit

# Terminal 2: 启动 DLL 编译
lerna run start --scope @next-core/brick-dll

# Terminal 3: 启动容器
yarn start
```

### 构建

```bash
yarn build              # 构建所有包
lerna run build         # 同上
yarn size-limit         # 检查包大小限制 (自动在 postbuild 运行)
```

### 测试

```bash
yarn test               # 运行所有测试
yarn test:ci            # CI 测试 (带覆盖率)

# 测试单个文件
yarn test ./path/to/your.spec.ts
next-jest ./path/to/your.spec.ts

# E2E 测试
yarn cypress:open       # 打开 Cypress UI
yarn cypress:run        # 运行 Cypress (带录制)
yarn test:e2e:no-record # 运行 Cypress (不录制)
```

### 其他命令

```bash
yarn yo                 # 生成新的 DLL 包
yarn docs:build         # 构建文档
yarn docs:dev           # 开发模式文档服务
```

## 技术栈

### 构建工具

- **包管理**: Yarn Workspace + Lerna 5
- **构建**: Webpack 4, Rollup 2 (不支持 Webpack 5)
- **编译**: TypeScript 4.7.4, Babel 7
- **样式**: Less 3, PostCSS 8
- **缓存**: Nx 缓存 (见 nx.json)

### 框架和库

- **React**: 16.14 (不是 17 或 18)
- **UI**: Ant Design ~4.12.3
- **路由**: History 4.10
- **国际化**: i18next 22
- **时间**: Moment 2.29

### 测试

- **单元测试**: Jest 29.3 + Enzyme
- **E2E**: Cypress 12.2
- **环境**: jsdom

## 代码规范

### TypeScript 配置

- **目标**: ESNext
- **模块**: ESNext (保留 JSX,由 Babel 处理)
- **严格模式**: 启用,但 `strictNullChecks: false`
- **装饰器**: 启用实验性装饰器

### 编码规范

- **缩进**: 2 空格 (见 .editorconfig)
- **ESLint**: 使用 `@next-core/eslint-config-next`
- **格式化**: Prettier 2.8

## 重要约束

### 版本锁定

- React 必须是 16.14,不能升级到 17 或 18
- Ant Design 锁定在 ~4.12.3
- TypeScript ~4.7.4
- 不支持 Webpack 5

### 包大小限制

项目使用 `.size-limit.js` 严格控制产物大小:

- dll.\*.js: 1.44 MB
- dll-of-echarts.\*.js: 295 KB
- dll-of-ace.\*.js: 125 KB
- icons-\*.js: 900 KB

### DLL 机制

DLL 预编译机制用于优化大型依赖的加载。修改 DLL exports 后需要更新 manifest (CI 会检测)。

## CI/CD 流程

### 主要检查

1. 构建所有包
2. 运行测试 + 覆盖率
3. Cypress E2E 测试
4. 包大小限制检查
5. API 签名检查
6. DLL manifest 检查

### 常见 CI 错误

- **"You have changed the public API signature"**: 为 PR 添加标签 `eve: update docs etc`
- **"Manifest snapshot not match"**: 为 PR 添加标签 `eve: update dll manifest`

### 发布

- 使用 Lerna 独立版本管理
- 允许从 `master` 和 `legacy/**` 分支发布
- 自动发布到 NPM (触发: Git tags)
- 自动同步到淘宝 NPM 镜像

## 文件结构说明

```
packages/
├── brick-container/     # Express 服务器,微应用容器
├── brick-dll/          # Vendors DLL 预编译
├── brick-kit/          # 核心运行时内核
├── brick-http/         # HTTP 请求库
├── brick-utils/        # 工具函数
├── brick-types/        # TypeScript 类型
├── storyboard/         # Storyboard 解析
├── cook/              # 表达式处理
├── supply/            # 函数上下文供应
├── brick-scripts/      # 构件开发脚本
├── sdk-scripts/        # SDK 生成脚本
├── jest-config-factory/ # Jest 配置
├── webpack-config-factory/ # Webpack 配置
├── rollup-config-factory/  # Rollup 配置
└── [其他 40+ 包]

dll/                    # 7 个 DLL 预编译包
v3/                     # 13 个 V3 兼容包
```

## 工作流程图

完整的代码执行流程图见: `assets/next-core代码执行流程图.png`

## 独立打包调试

现在无需在 `dev.config.js` 配置 `standaloneAppsConfig` 即可调试独立打包的微应用。如需调试远端独立打包:

```bash
yarn serve --subdir --server=https://admin.easyops.local
```

## 相关仓库

- **构件仓库**: https://github.com/easyops-cn/next-basics (包含构件包和微应用示例)
- **Demo 仓库**: https://github.com/easyops-cn/next-demo (快速体验)
- **文档**: http://docs.developers.easyops.cn/
