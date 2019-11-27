# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.3.3](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@1.3.2...@easyops/webpack-config-factory@1.3.3) (2019-11-27)

### Bug Fixes

- set esModule to false for url-loader which is required by @svgr/webpack ([d7f7300](https://git.easyops.local/anyclouds/next-core/commits/d7f7300))

## [1.3.2](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@1.3.1...@easyops/webpack-config-factory@1.3.2) (2019-11-27)

**Note:** Version bump only for package @easyops/webpack-config-factory

## [1.3.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@1.3.0...@easyops/webpack-config-factory@1.3.1) (2019-11-21)

### Bug Fixes

- all legacy invalid bricks renamed ([b995843](https://git.easyops.local/anyclouds/next-core/commits/b995843))

# [1.3.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@1.2.1...@easyops/webpack-config-factory@1.3.0) (2019-11-18)

### Features

- ensure bricks and templates are prefixed by the package name ([7cc0557](https://git.easyops.local/anyclouds/next-core/commits/7cc0557))

## [1.2.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@1.2.0...@easyops/webpack-config-factory@1.2.1) (2019-11-13)

**Note:** Version bump only for package @easyops/webpack-config-factory

# [1.2.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@1.1.0...@easyops/webpack-config-factory@1.2.0) (2019-11-11)

### Features

- drop `useToStringLoaderInsteadOfStyleLoader` ([33a6989](https://git.easyops.local/anyclouds/next-core/commits/33a6989))

# [1.1.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@1.0.0...@easyops/webpack-config-factory@1.1.0) (2019-11-08)

### Features

- support less (for custom antd styles) in @bricks/\* ([21fc734](https://git.easyops.local/anyclouds/next-core/commits/21fc734))

# [1.0.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@0.11.5...@easyops/webpack-config-factory@1.0.0) (2019-11-03)

**Note:** Version bump only for package @easyops/webpack-config-factory

## [0.11.5](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@0.11.4...@easyops/webpack-config-factory@0.11.5) (2019-10-21)

**Note:** Version bump only for package @easyops/webpack-config-factory

## [0.11.4](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@0.11.3...@easyops/webpack-config-factory@0.11.4) (2019-10-17)

### Bug Fixes

- ensure scanned bricks and templates are unique when building ([9e55400](https://git.easyops.local/anyclouds/next-core/commits/9e55400))

## [0.11.3](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@0.11.2...@easyops/webpack-config-factory@0.11.3) (2019-10-15)

### Bug Fixes

- fix errors when building templates ([789c1f1](https://git.easyops.local/anyclouds/next-core/commits/789c1f1))

## [0.11.2](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@0.11.1...@easyops/webpack-config-factory@0.11.2) (2019-10-15)

**Note:** Version bump only for package @easyops/webpack-config-factory

## [0.11.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@0.11.0...@easyops/webpack-config-factory@0.11.1) (2019-10-12)

### Bug Fixes

- fix errors when building templates ([67dbf15](https://git.easyops.local/anyclouds/next-core/commits/67dbf15))

# [0.11.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@0.10.1...@easyops/webpack-config-factory@0.11.0) (2019-10-12)

### Features

- scan registered templates in template packages when building ([3a3aaed](https://git.easyops.local/anyclouds/next-core/commits/3a3aaed))

## [0.10.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@0.10.0...@easyops/webpack-config-factory@0.10.1) (2019-10-10)

**Note:** Version bump only for package @easyops/webpack-config-factory

# [0.10.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@0.9.3...@easyops/webpack-config-factory@0.10.0) (2019-10-09)

### Features

- 调整构件库及小产品的依赖声明方式，以支持构件库拆分 git 仓库 ([b5a552d](https://git.easyops.local/anyclouds/next-core/commits/b5a552d))

## [0.9.3](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@0.9.2...@easyops/webpack-config-factory@0.9.3) (2019-10-08)

**Note:** Version bump only for package @easyops/webpack-config-factory

## [0.9.2](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@0.9.1...@easyops/webpack-config-factory@0.9.2) (2019-09-19)

### Bug Fixes

- use `@easyops/brick-dll` in `@dll/*` only if specified ([607a172](https://git.easyops.local/anyclouds/next-core/commits/607a172))
- use `@easyops/brick-dll` in `@dll/ace` too ([f2b99ca](https://git.easyops.local/anyclouds/next-core/commits/f2b99ca))

## [0.9.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@0.9.0...@easyops/webpack-config-factory@0.9.1) (2019-09-19)

### Bug Fixes

- fix loading dll errors ([2b4ed46](https://git.easyops.local/anyclouds/next-core/commits/2b4ed46))

# [0.9.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@0.8.4...@easyops/webpack-config-factory@0.9.0) (2019-09-18)

### Features

- auto detect used dlls ([e070f6b](https://git.easyops.local/anyclouds/next-core/commits/e070f6b))

## [0.8.4](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@0.8.3...@easyops/webpack-config-factory@0.8.4) (2019-09-18)

**Note:** Version bump only for package @easyops/webpack-config-factory

## [0.8.3](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@0.8.2...@easyops/webpack-config-factory@0.8.3) (2019-09-06)

**Note:** Version bump only for package @easyops/webpack-config-factory

## [0.8.2](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@0.8.1...@easyops/webpack-config-factory@0.8.2) (2019-08-30)

**Note:** Version bump only for package @easyops/webpack-config-factory

## [0.8.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/webpack-config-factory@0.8.0...@easyops/webpack-config-factory@0.8.1) (2019-08-30)

**Note:** Version bump only for package @easyops/webpack-config-factory

# 0.8.0 (2019-08-30)

### Features

- repo moved ([19b02c7](https://git.easyops.local/anyclouds/next-core/commits/19b02c7))

# [0.7.0](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/webpack-config-factory@0.6.0...@easyops/webpack-config-factory@0.7.0) (2019-07-24)

### Features

- dynamic dll, ref [#5](https://git.easyops.local/anyclouds/brick-next/issues/5) ([7888ccd](https://git.easyops.local/anyclouds/brick-next/commits/7888ccd))

# [0.6.0](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/webpack-config-factory@0.5.2...@easyops/webpack-config-factory@0.6.0) (2019-07-15)

### Features

- **webpack:** svg 支持 url 输出 ([d23c4b8](https://git.easyops.local/anyclouds/brick-next/commits/d23c4b8))

## [0.5.2](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/webpack-config-factory@0.5.1...@easyops/webpack-config-factory@0.5.2) (2019-07-03)

**Note:** Version bump only for package @easyops/webpack-config-factory

## [0.5.1](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/webpack-config-factory@0.5.0...@easyops/webpack-config-factory@0.5.1) (2019-06-24)

**Note:** Version bump only for package @easyops/webpack-config-factory

# [0.5.0](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/webpack-config-factory@0.4.0...@easyops/webpack-config-factory@0.5.0) (2019-06-21)

### Features

- **developer:** support documentation ([12113f5](https://git.easyops.local/anyclouds/brick-next/commits/12113f5))

# 0.4.0 (2019-06-19)

### Features

- **post-build:** auto generate deploy/\* and .pkgbuild after build ([4215ec9](https://git.easyops.local/anyclouds/brick-next/commits/4215ec9))
- **sdk-scripts:** generate contracts.yaml ([94e97e9](https://git.easyops.local/anyclouds/brick-next/commits/94e97e9))
