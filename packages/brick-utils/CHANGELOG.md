# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.36.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.35.0...@easyops/brick-utils@1.36.0) (2020-03-17)

### Bug Fixes

- refine peerDependencies and put `buffer` back to dll ([e58b2a5](https://git.easyops.local/anyclouds/next-core/commits/e58b2a5))

### Features

- **pipe:** new pipes, `sort` and `reverse`, refs BRICK_STORE-1271 ([2d3027a](https://git.easyops.local/anyclouds/next-core/commits/2d3027a))

# [1.35.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.34.0...@easyops/brick-utils@1.35.0) (2020-03-11)

### Features

- **pipe:** new pipes, `mapToArray`, `find`, `findLast`, `findIndex`, `findLastIndex` ([ac38f9d](https://git.easyops.local/anyclouds/next-core/commits/ac38f9d))

# [1.34.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.33.0...@easyops/brick-utils@1.34.0) (2020-03-10)

### Features

- **pipe:** substr and substring, refs BRICK_STORE-1263 ([ac3c14b](https://git.easyops.local/anyclouds/next-core/commits/ac3c14b))

# [1.33.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.32.0...@easyops/brick-utils@1.33.0) (2020-03-09)

### Features

- ternary pipe refs MONITOR-302 ([8b6727c](https://git.easyops.local/anyclouds/next-core/commits/8b6727c))
- **pipe:** uniq ([425c01b](https://git.easyops.local/anyclouds/next-core/commits/425c01b))

# [1.32.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.31.0...@easyops/brick-utils@1.32.0) (2020-03-08)

### Features

- **pipe:** support `countBy`, add `indent` parameter for json and yaml ([a0cba12](https://git.easyops.local/anyclouds/next-core/commits/a0cba12))

# [1.31.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.30.1...@easyops/brick-utils@1.31.0) (2020-03-05)

### Features

- handle time to timeStamp refs MONITOR-362 ([d9e4f62](https://git.easyops.local/anyclouds/next-core/commits/d9e4f62))

## [1.30.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.30.0...@easyops/brick-utils@1.30.1) (2020-03-04)

### Bug Fixes

- ignore `${{...}}` in placeholders ([a5fcc1a](https://git.easyops.local/anyclouds/next-core/commits/a5fcc1a))

# [1.30.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.29.0...@easyops/brick-utils@1.30.0) (2020-03-03)

### Features

- 迁移内置事件相关逻辑到 bric-kit，并新增 message 和 handleHttpError ,handleHttpError action ([6bf4baa](https://git.easyops.local/anyclouds/next-core/commits/6bf4baa))

# [1.29.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.28.0...@easyops/brick-utils@1.29.0) (2020-03-02)

### Features

- **placeholder:** add `yaml` and `yamlStringify` pipe, refs BRICK_STORE-1167 ([a261bfd](https://git.easyops.local/anyclouds/next-core/commits/a261bfd))

# [1.28.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.27.0...@easyops/brick-utils@1.28.0) (2020-03-02)

### Bug Fixes

- support `${ANCHOR.x}` ([4498402](https://git.easyops.local/anyclouds/next-core/commits/4498402))

### Features

- **placeholder:** support more pipes, like `get`, `join`, +/-/\*/÷ and others ([5dfc007](https://git.easyops.local/anyclouds/next-core/commits/5dfc007))

# [1.27.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.26.1...@easyops/brick-utils@1.27.0) (2020-02-28)

### Features

- build event iframe, Refs INSTANCE-1045 ([a403ec0](https://git.easyops.local/anyclouds/next-core/commits/a403ec0))

## [1.26.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.26.0...@easyops/brick-utils@1.26.1) (2020-02-28)

### Bug Fixes

- transform only spread the first level keys ([75ee477](https://git.easyops.local/anyclouds/next-core/commits/75ee477))

# [1.26.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.25.0...@easyops/brick-utils@1.26.0) (2020-02-28)

### Bug Fixes

- warn if `updateArgs` received a non-custom-event ([e01bbe8](https://git.easyops.local/anyclouds/next-core/commits/e01bbe8))

### Features

- support callback in event handlers ([3bd551e](https://git.easyops.local/anyclouds/next-core/commits/3bd551e))

# [1.25.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.24.1...@easyops/brick-utils@1.25.0) (2020-02-27)

### Features

- **pipe:** groupByToIndex ([7a53773](https://git.easyops.local/anyclouds/next-core/commits/7a53773))

## [1.24.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.24.0...@easyops/brick-utils@1.24.1) (2020-02-27)

### Bug Fixes

- **placeholder:** make placeholders more restricted. ([7741d74](https://git.easyops.local/anyclouds/next-core/commits/7741d74))

# [1.24.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.23.0...@easyops/brick-utils@1.24.0) (2020-02-27)

### Features

- support onAnchorLoad / onAnchorUnload ([40155ff](https://git.easyops.local/anyclouds/next-core/commits/40155ff))

# [1.23.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.22.0...@easyops/brick-utils@1.23.0) (2020-02-25)

### Features

- add pipe map refs MONITOR-259 ([450e03e](https://git.easyops.local/anyclouds/next-core/commits/450e03e))

# [1.22.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.21.0...@easyops/brick-utils@1.22.0) (2020-02-24)

### Bug Fixes

- pipe parameters also support literal string ([8a6c7a2](https://git.easyops.local/anyclouds/next-core/commits/8a6c7a2))

### Features

- **transform:** support transform from mixed array and non-array ([19f242b](https://git.easyops.local/anyclouds/next-core/commits/19f242b))

# [1.21.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.20.1...@easyops/brick-utils@1.21.0) (2020-02-24)

### Features

- support pipe parameters and complex value in placeholders ([317e63b](https://git.easyops.local/anyclouds/next-core/commits/317e63b))

## [1.20.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.20.0...@easyops/brick-utils@1.20.1) (2020-02-21)

**Note:** Version bump only for package @easyops/brick-utils

# [1.20.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.19.0...@easyops/brick-utils@1.20.0) (2020-02-20)

### Features

- add listen event: window open, Refs BRICK_STORE-1131 ([e83e6bc](https://git.easyops.local/anyclouds/next-core/commits/e83e6bc))

# [1.19.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.18.0...@easyops/brick-utils@1.19.0) (2020-02-19)

### Features

- builtin location assign refs BRICK_STORE-1131 ([9597e79](https://git.easyops.local/anyclouds/next-core/commits/9597e79))

# [1.18.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.17.0...@easyops/brick-utils@1.18.0) (2020-02-19)

### Features

- support array values in query ([a4a8544](https://git.easyops.local/anyclouds/next-core/commits/a4a8544))

# [1.17.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.16.0...@easyops/brick-utils@1.17.0) (2020-02-18)

### Features

- new method for providers: setArgs/setArgsAndExecute ([b10ca3f](https://git.easyops.local/anyclouds/next-core/commits/b10ca3f))
- new pipe: not ([b3e5057](https://git.easyops.local/anyclouds/next-core/commits/b3e5057))
- remove processStoryboard and processBrick ([9f8ac13](https://git.easyops.local/anyclouds/next-core/commits/9f8ac13))
- support if in BrickConf ([a7d9334](https://git.easyops.local/anyclouds/next-core/commits/a7d9334)), closes [anyclouds/brick-next#22](https://git.easyops.local/anyclouds/next-core/issues/22)
- support injecting feature flags ([dc2a906](https://git.easyops.local/anyclouds/next-core/commits/dc2a906))
- transform support default value and pipes ([cd4986c](https://git.easyops.local/anyclouds/next-core/commits/cd4986c))

# [1.16.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.15.0...@easyops/brick-utils@1.16.0) (2020-02-15)

### Features

- unbindListeners ([a567cc4](https://git.easyops.local/anyclouds/next-core/commits/a567cc4))

# [1.15.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.14.0...@easyops/brick-utils@1.15.0) (2020-02-13)

### Features

- 框架提供 instanceId 变量 ([22a04b5](https://git.easyops.local/anyclouds/next-core/commits/22a04b5))

# [1.14.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.13.1...@easyops/brick-utils@1.14.0) (2020-02-12)

### Features

- support redirect in routes ([2e290ff](https://git.easyops.local/anyclouds/next-core/commits/2e290ff)), closes [anyclouds/brick-next#20](https://git.easyops.local/anyclouds/next-core/issues/20)

## [1.13.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.13.0...@easyops/brick-utils@1.13.1) (2020-02-11)

**Note:** Version bump only for package @easyops/brick-utils

# [1.13.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.12.0...@easyops/brick-utils@1.13.0) (2020-02-07)

### Features

- 框架提供当前用户的系统变量 ([cff4566](https://git.easyops.local/anyclouds/next-core/commits/cff4566))

# [1.12.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.11.0...@easyops/brick-utils@1.12.0) (2020-02-07)

### Features

- **provider:** support `executeWithArgs` ([ce2eb38](https://git.easyops.local/anyclouds/next-core/commits/ce2eb38))

# [1.11.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.10.0...@easyops/brick-utils@1.11.0) (2020-02-05)

### Features

- support routes in routes ([2ac2a81](https://git.easyops.local/anyclouds/next-core/commits/2ac2a81))

# [1.10.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.9.2...@easyops/brick-utils@1.10.0) (2020-02-04)

### Features

- add 'history.reload' and 'event.preventDefault' brick event action ([7f8363c](https://git.easyops.local/anyclouds/next-core/commits/7f8363c))
- **set-properties:** `injectDeep` default to be true, refs BRICK_STORE-987 ([cd12bb8](https://git.easyops.local/anyclouds/next-core/commits/cd12bb8))

## [1.9.2](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.9.1...@easyops/brick-utils@1.9.2) (2020-01-29)

**Note:** Version bump only for package @easyops/brick-utils

## [1.9.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.9.0...@easyops/brick-utils@1.9.1) (2020-01-21)

**Note:** Version bump only for package @easyops/brick-utils

# [1.9.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.8.0...@easyops/brick-utils@1.9.0) (2020-01-20)

### Features

- support `lifeCycle.onPageLoad` ([610cdab](https://git.easyops.local/anyclouds/next-core/commits/610cdab))

# [1.8.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.7.2...@easyops/brick-utils@1.8.0) (2020-01-19)

### Features

- **bindListeners:** history.pushQuery & history.replaceQuery ([99ff354](https://git.easyops.local/anyclouds/next-core/commits/99ff354))

## [1.7.2](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.7.1...@easyops/brick-utils@1.7.2) (2020-01-17)

### Bug Fixes

- **setProperties:** fix injecting with default value followed by empty string ([88b4734](https://git.easyops.local/anyclouds/next-core/commits/88b4734))

## [1.7.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.7.0...@easyops/brick-utils@1.7.1) (2020-01-15)

### Bug Fixes

- **transform/setProperties:** replace null/undefined with empty string ([52a4b9d](https://git.easyops.local/anyclouds/next-core/commits/52a4b9d))

# [1.7.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.6.1...@easyops/brick-utils@1.7.0) (2020-01-14)

### Features

- `useBrick.events` in BrickAsComponent supports transform ([863a566](https://git.easyops.local/anyclouds/next-core/commits/863a566))

## [1.6.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.6.0...@easyops/brick-utils@1.6.1) (2020-01-13)

### Bug Fixes

- scan providers as bricks ([ef16ec9](https://git.easyops.local/anyclouds/next-core/commits/ef16ec9))

# [1.6.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.5.0...@easyops/brick-utils@1.6.0) (2020-01-13)

### Features

- define resolves ([79927da](https://git.easyops.local/anyclouds/next-core/commits/79927da))

# [1.5.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.4.0...@easyops/brick-utils@1.5.0) (2020-01-09)

### Features

- **properties-pipe:** jsonStringify ([35b856d](https://git.easyops.local/anyclouds/next-core/commits/35b856d))

# [1.4.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.3.4...@easyops/brick-utils@1.4.0) (2020-01-08)

### Features

- unified properties transform ([06699d3](https://git.easyops.local/anyclouds/next-core/commits/06699d3))

## [1.3.4](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.3.3...@easyops/brick-utils@1.3.4) (2020-01-02)

**Note:** Version bump only for package @easyops/brick-utils

## [1.3.3](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.3.2...@easyops/brick-utils@1.3.3) (2019-12-11)

**Note:** Version bump only for package @easyops/brick-utils

## [1.3.2](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.3.1...@easyops/brick-utils@1.3.2) (2019-12-10)

**Note:** Version bump only for package @easyops/brick-utils

## [1.3.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.3.0...@easyops/brick-utils@1.3.1) (2019-11-27)

**Note:** Version bump only for package @easyops/brick-utils

# [1.3.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.2.2...@easyops/brick-utils@1.3.0) (2019-11-26)

### Features

- **brick-utils:** 构件事件支持设置目标的属性 ([a0d9b9b](https://git.easyops.local/anyclouds/next-core/commits/a0d9b9b))

## [1.2.2](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.2.1...@easyops/brick-utils@1.2.2) (2019-11-13)

### Bug Fixes

- fix for path-to-regexp v5 ([4991625](https://git.easyops.local/anyclouds/next-core/commits/4991625))

## [1.2.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.2.0...@easyops/brick-utils@1.2.1) (2019-11-11)

### Bug Fixes

- macth will conflict ([dbdf31f](https://git.easyops.local/anyclouds/next-core/commits/dbdf31f))

# [1.2.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.1.2...@easyops/brick-utils@1.2.0) (2019-11-11)

### Features

- should save hash ([be7ed4b](https://git.easyops.local/anyclouds/next-core/commits/be7ed4b))

## [1.1.2](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.1.1...@easyops/brick-utils@1.1.2) (2019-11-11)

### Bug Fixes

- use `closeDeep` to remember original template params ([d7f81a5](https://git.easyops.local/anyclouds/next-core/commits/d7f81a5))

## [1.1.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.1.0...@easyops/brick-utils@1.1.1) (2019-11-08)

**Note:** Version bump only for package @easyops/brick-utils

# [1.1.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.0.1...@easyops/brick-utils@1.1.0) (2019-11-07)

### Features

- **brick-utils:** event 的 action 支持 history.goBack, history.goForward, location.reload ([7372358](https://git.easyops.local/anyclouds/next-core/commits/7372358))

## [1.0.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@1.0.0...@easyops/brick-utils@1.0.1) (2019-11-07)

### Bug Fixes

- ignore injecting event if no event provided in context ([3e57e02](https://git.easyops.local/anyclouds/next-core/commits/3e57e02))

# [1.0.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.15.5...@easyops/brick-utils@1.0.0) (2019-11-03)

**Note:** Version bump only for package @easyops/brick-utils

## [0.15.5](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.15.4...@easyops/brick-utils@0.15.5) (2019-10-31)

**Note:** Version bump only for package @easyops/brick-utils

## [0.15.4](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.15.3...@easyops/brick-utils@0.15.4) (2019-10-29)

**Note:** Version bump only for package @easyops/brick-utils

## [0.15.3](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.15.2...@easyops/brick-utils@0.15.3) (2019-10-29)

**Note:** Version bump only for package @easyops/brick-utils

## [0.15.2](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.15.1...@easyops/brick-utils@0.15.2) (2019-10-29)

### Bug Fixes

- fix a bug when a template returns a template ([1a00ccf](https://git.easyops.local/anyclouds/next-core/commits/1a00ccf))

## [0.15.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.15.0...@easyops/brick-utils@0.15.1) (2019-10-24)

**Note:** Version bump only for package @easyops/brick-utils

# [0.15.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.14.2...@easyops/brick-utils@0.15.0) (2019-10-22)

### Features

- restore dynamic templates before render ([3eb387b](https://git.easyops.local/anyclouds/next-core/commits/3eb387b))

## [0.14.2](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.14.1...@easyops/brick-utils@0.14.2) (2019-10-22)

**Note:** Version bump only for package @easyops/brick-utils

## [0.14.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.14.0...@easyops/brick-utils@0.14.1) (2019-10-21)

### Bug Fixes

- fix template resolves ([2f6f73a](https://git.easyops.local/anyclouds/next-core/commits/2f6f73a))

# [0.14.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.13.0...@easyops/brick-utils@0.14.0) (2019-10-21)

### Features

- async mount routes and bricks to support templates use resolves ([726ae33](https://git.easyops.local/anyclouds/next-core/commits/726ae33))

# [0.13.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.12.0...@easyops/brick-utils@0.13.0) (2019-10-19)

### Features

- async process storyboard to support templates in templates ([75ec2bd](https://git.easyops.local/anyclouds/next-core/commits/75ec2bd))

# [0.12.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.11.0...@easyops/brick-utils@0.12.0) (2019-10-17)

### Features

- add a develop helper: processBrick() ([9f3dab5](https://git.easyops.local/anyclouds/next-core/commits/9f3dab5))

# [0.11.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.10.4...@easyops/brick-utils@0.11.0) (2019-10-16)

### Features

- internal used bricks and templates ([9f2d00c](https://git.easyops.local/anyclouds/next-core/commits/9f2d00c))

## [0.10.4](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.10.3...@easyops/brick-utils@0.10.4) (2019-10-15)

**Note:** Version bump only for package @easyops/brick-utils

## [0.10.3](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.10.2...@easyops/brick-utils@0.10.3) (2019-10-14)

**Note:** Version bump only for package @easyops/brick-utils

## [0.10.2](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.10.1...@easyops/brick-utils@0.10.2) (2019-10-14)

**Note:** Version bump only for package @easyops/brick-utils

## [0.10.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.10.0...@easyops/brick-utils@0.10.1) (2019-10-12)

### Bug Fixes

- only collect non-falsy bricks ([36083eb](https://git.easyops.local/anyclouds/next-core/commits/36083eb))

# [0.10.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.9.8...@easyops/brick-utils@0.10.0) (2019-10-12)

### Features

- scan and process templates in storyboards ([5dcdc30](https://git.easyops.local/anyclouds/next-core/commits/5dcdc30))

## [0.9.8](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.9.7...@easyops/brick-utils@0.9.8) (2019-09-30)

**Note:** Version bump only for package @easyops/brick-utils

## [0.9.7](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.9.6...@easyops/brick-utils@0.9.7) (2019-09-25)

**Note:** Version bump only for package @easyops/brick-utils

## [0.9.6](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.9.5...@easyops/brick-utils@0.9.6) (2019-09-24)

**Note:** Version bump only for package @easyops/brick-utils

## [0.9.5](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.9.4...@easyops/brick-utils@0.9.5) (2019-09-23)

**Note:** Version bump only for package @easyops/brick-utils

## [0.9.4](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.9.3...@easyops/brick-utils@0.9.4) (2019-09-18)

**Note:** Version bump only for package @easyops/brick-utils

## [0.9.3](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.9.2...@easyops/brick-utils@0.9.3) (2019-09-18)

**Note:** Version bump only for package @easyops/brick-utils

## [0.9.2](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.9.1...@easyops/brick-utils@0.9.2) (2019-09-17)

**Note:** Version bump only for package @easyops/brick-utils

## [0.9.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.9.0...@easyops/brick-utils@0.9.1) (2019-09-17)

**Note:** Version bump only for package @easyops/brick-utils

# [0.9.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.8.1...@easyops/brick-utils@0.9.0) (2019-09-14)

### Features

- support compute properties by APP.homepage ([1fa7f25](https://git.easyops.local/anyclouds/next-core/commits/1fa7f25))

## [0.8.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.8.0...@easyops/brick-utils@0.8.1) (2019-09-11)

**Note:** Version bump only for package @easyops/brick-utils

# [0.8.0](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.7.2...@easyops/brick-utils@0.8.0) (2019-09-10)

### Features

- support compute route path by template ([743f4fc](https://git.easyops.local/anyclouds/next-core/commits/743f4fc))

## [0.7.2](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.7.1...@easyops/brick-utils@0.7.2) (2019-09-04)

**Note:** Version bump only for package @easyops/brick-utils

## [0.7.1](https://git.easyops.local/anyclouds/next-core/compare/@easyops/brick-utils@0.7.0...@easyops/brick-utils@0.7.1) (2019-08-30)

**Note:** Version bump only for package @easyops/brick-utils

# 0.7.0 (2019-08-30)

### Features

- repo moved ([19b02c7](https://git.easyops.local/anyclouds/next-core/commits/19b02c7))

## [0.6.5](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.6.4...@easyops/brick-utils@0.6.5) (2019-08-28)

**Note:** Version bump only for package @easyops/brick-utils

## [0.6.4](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.6.3...@easyops/brick-utils@0.6.4) (2019-08-28)

**Note:** Version bump only for package @easyops/brick-utils

## [0.6.3](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.6.2...@easyops/brick-utils@0.6.3) (2019-08-26)

**Note:** Version bump only for package @easyops/brick-utils

## [0.6.2](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.6.1...@easyops/brick-utils@0.6.2) (2019-08-23)

**Note:** Version bump only for package @easyops/brick-utils

## [0.6.1](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.6.0...@easyops/brick-utils@0.6.1) (2019-08-22)

**Note:** Version bump only for package @easyops/brick-utils

# [0.6.0](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.5.4...@easyops/brick-utils@0.6.0) (2019-08-20)

### Features

- **brick-utils:** support use `${query.*}` ([65aa658](https://git.easyops.local/anyclouds/brick-next/commits/65aa658))

## [0.5.4](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.5.3...@easyops/brick-utils@0.5.4) (2019-08-19)

**Note:** Version bump only for package @easyops/brick-utils

## [0.5.3](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.5.2...@easyops/brick-utils@0.5.3) (2019-08-16)

**Note:** Version bump only for package @easyops/brick-utils

## [0.5.2](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.5.1...@easyops/brick-utils@0.5.2) (2019-08-14)

**Note:** Version bump only for package @easyops/brick-utils

## [0.5.1](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.5.0...@easyops/brick-utils@0.5.1) (2019-08-09)

**Note:** Version bump only for package @easyops/brick-utils

# [0.5.0](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.4.7...@easyops/brick-utils@0.5.0) (2019-08-07)

### Features

- **brick-table:** sort ([09c8fd1](https://git.easyops.local/anyclouds/brick-next/commits/09c8fd1))

## [0.4.7](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.4.6...@easyops/brick-utils@0.4.7) (2019-08-06)

**Note:** Version bump only for package @easyops/brick-utils

## [0.4.6](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.4.5...@easyops/brick-utils@0.4.6) (2019-08-05)

**Note:** Version bump only for package @easyops/brick-utils

## [0.4.5](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.4.4...@easyops/brick-utils@0.4.5) (2019-08-05)

**Note:** Version bump only for package @easyops/brick-utils

## [0.4.4](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.4.3...@easyops/brick-utils@0.4.4) (2019-08-02)

**Note:** Version bump only for package @easyops/brick-utils

## [0.4.3](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.4.2...@easyops/brick-utils@0.4.3) (2019-07-30)

**Note:** Version bump only for package @easyops/brick-utils

## [0.4.2](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.4.1...@easyops/brick-utils@0.4.2) (2019-07-29)

**Note:** Version bump only for package @easyops/brick-utils

## [0.4.1](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.4.0...@easyops/brick-utils@0.4.1) (2019-07-29)

**Note:** Version bump only for package @easyops/brick-utils

# [0.4.0](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.3.1...@easyops/brick-utils@0.4.0) (2019-07-26)

### Features

- **brick-utils:** support template string in event's args ([0aeb606](https://git.easyops.local/anyclouds/brick-next/commits/0aeb606))

## [0.3.1](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.3.0...@easyops/brick-utils@0.3.1) (2019-07-25)

**Note:** Version bump only for package @easyops/brick-utils

# [0.3.0](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.2.1...@easyops/brick-utils@0.3.0) (2019-07-24)

### Features

- dynamic dll, ref [#5](https://git.easyops.local/anyclouds/brick-next/issues/5) ([7888ccd](https://git.easyops.local/anyclouds/brick-next/commits/7888ccd))

## [0.2.1](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.2.0...@easyops/brick-utils@0.2.1) (2019-07-23)

**Note:** Version bump only for package @easyops/brick-utils

# [0.2.0](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.1.0...@easyops/brick-utils@0.2.0) (2019-07-23)

### Features

- 根据接口 SDK 自动生成接口契约构件 ([2fd0cdc](https://git.easyops.local/anyclouds/brick-next/commits/2fd0cdc))

# [0.1.0](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.0.13...@easyops/brick-utils@0.1.0) (2019-07-22)

### Features

- loading bar ([96c0f18](https://git.easyops.local/anyclouds/brick-next/commits/96c0f18))

## [0.0.13](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.0.12...@easyops/brick-utils@0.0.13) (2019-07-19)

**Note:** Version bump only for package @easyops/brick-utils

## [0.0.12](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.0.11...@easyops/brick-utils@0.0.12) (2019-07-18)

**Note:** Version bump only for package @easyops/brick-utils

## [0.0.11](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.0.10...@easyops/brick-utils@0.0.11) (2019-07-16)

**Note:** Version bump only for package @easyops/brick-utils

## [0.0.10](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.0.9...@easyops/brick-utils@0.0.10) (2019-07-15)

**Note:** Version bump only for package @easyops/brick-utils

## [0.0.9](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.0.8...@easyops/brick-utils@0.0.9) (2019-07-14)

**Note:** Version bump only for package @easyops/brick-utils

## [0.0.8](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.0.7...@easyops/brick-utils@0.0.8) (2019-07-13)

**Note:** Version bump only for package @easyops/brick-utils

## [0.0.7](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.0.6...@easyops/brick-utils@0.0.7) (2019-07-12)

**Note:** Version bump only for package @easyops/brick-utils

## [0.0.6](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.0.5...@easyops/brick-utils@0.0.6) (2019-07-10)

**Note:** Version bump only for package @easyops/brick-utils

## [0.0.5](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.0.4...@easyops/brick-utils@0.0.5) (2019-07-09)

**Note:** Version bump only for package @easyops/brick-utils

## [0.0.4](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.0.3...@easyops/brick-utils@0.0.4) (2019-07-09)

**Note:** Version bump only for package @easyops/brick-utils

## [0.0.3](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.0.2...@easyops/brick-utils@0.0.3) (2019-07-09)

**Note:** Version bump only for package @easyops/brick-utils

## [0.0.2](https://git.easyops.local/anyclouds/brick-next/compare/@easyops/brick-utils@0.0.1...@easyops/brick-utils@0.0.2) (2019-07-08)

**Note:** Version bump only for package @easyops/brick-utils

## 0.0.1 (2019-07-05)

**Note:** Version bump only for package @easyops/brick-utils
