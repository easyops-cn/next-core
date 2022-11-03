# Easy Bricks Core

[![CI Status](https://github.com/easyops-cn/next-core/workflows/CI/badge.svg?event=push)](https://github.com/easyops-cn/next-core/actions?query=workflow%3ACI)
[![Coverage Status](https://codecov.io/gh/easyops-cn/next-core/branch/master/graph/badge.svg?token=XSPIZ7X5WH)](https://codecov.io/gh/easyops-cn/next-core)
[![Cypress Status](https://img.shields.io/endpoint?url=https://dashboard.cypress.io/badge/simple/67qbbe/master&style=flat&logo=cypress)](https://dashboard.cypress.io/projects/67qbbe/runs)

[English](#readme) | [简体中文](#简体中文)

## Introduction

_Easy Bricks_ (formerly named _Brick Next_) is a front-end framework to build highly-pluggable and highly-configurable enterprise user interface solutions, a.k.a a low-code framework, which scales and for enterprise.

The front-end of UWinTech's brand new DevOps platform _EasyOps_ is fully built on Easy Bricks. Hundreds of micro-apps are rapidly and continuously delivered to our enterprise clients. Building enterprise productivity tools has never been easier.

This repository is the core of Easy Bricks, to play with Easy Bricks, please refer to [easyops-cn/next-demo](https://github.com/easyops-cn/next-demo) which is a ready-to-run repository, which demonstrate how to build micro-apps, as well as how to make custom bricks.

Table of contents:

- [Easy Bricks Under the Hood](#easy-bricks-under-the-hood)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Easy Bricks Under the Hood

```
+------------------------------+      +--------------------+
|        Brick Package         |      |     Micro App      |
| +---------+  +---------+     | ...  |  +--------------+  | ...
| | Brick A |  | Brick B | ... |      |  |  Storyboard  |  |
| +---------+  +---------+     |      |  +--------------+  |
+------------------------------+      +--------------------+

+---------------------------------------------------------------+
|                      Easy Bricks Core                         |
+---------------------------------------------------------------+
```

- _Brick packages_ define reusable _bricks_. Bricks are similar to components, but with more encapsulations, and can be easily consumed by declarations without programming. Actually bricks are [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components). Bricks can be business-free small UI components, and can be business-ful large components too.

- _Micro-apps_ are assembled from bricks by declaring a _Storyboard_. Storyboards can be defined by a YAML or JSON, or be made from a visualization tool.

- _Easy Bricks Core_ is responsible for parsing storyboards of micro-apps and mounting bricks accordingly.

- All brick packages and micro-apps are independently deployable. They work as plugins. Check out the real world examples of [brick packages](https://github.com/easyops-cn/next-basics/tree/master/bricks) and [micro-apps](https://github.com/easyops-cn/next-basics/tree/master/micro-apps) in [easyops-cn/next-basics](https://github.com/easyops-cn/next-basics).

By using Easy Bricks, which provides hundreds of bricks out of the box, users with limited programing skills can build an app in days even in hours, from scratch 🍻.

On the other hand, advanced developers can also create new bricks for complex businesses.

## Roadmap

- Q1 2021:
  - [x] Make _Easy Bricks Core_ and some basic brick packages open source.
  - [ ] Publish _Easy MA Builder_, which is based on a Docker image with _EasyOps Platform_ included (server side services).
  - [ ] Documentation website.
  - [ ] Micro-App Marketplace.
- Q2 2021:
  - [ ] Auto testing for micro-apps.
  - [ ] Online coding on Easy MA Builder (for advanced developers).

_Easy MA Builder_ - a visualization builder for micro-apps, is just on the way to public soon, please stay tuned.

![Visual builder](https://github.com/easyops-cn/next-demo/raw/master/assets/visual-builder.png)

## Contributing

See [Contribution Guide](./CONTRIBUTING.md).

## License

Easy Bricks Core is [GPL-3.0 licensed](./COPYING).

## 简体中文

## 简介

_Easy Bricks_ （以前称为 _Brick Next_ ）是优维科技的新一代前端框架，旨在提供一套高度插件化、高度可配置化的企业用户界面解决方案，也即一个可扩展的、企业级的低代码开发框架。

优维科技全新的 DevOps 平台 _EasyOps_ 的前端整个基于 Easy Bricks 搭建。数百个企业级的微应用得以快速地、持续地交付给我们的企业客户。搭建企业级生产力工具从未如此简单。

本仓库是 Easy Bricks 的核心库，如果希望体验 Easy Bricks，可以参考 [easyops-cn/next-demo](https://github.com/easyops-cn/next-demo)，这是一个准备就绪的仓库，用以演示如何编排微应用，以及如何创建自定义构件。

目录：

- [Easy Bricks 揭秘](#easy-bricks-揭秘)
- [路线图](#路线图)
- [贡献指南](#贡献指南)
- [许可协议](#许可协议)

## Easy Bricks 揭秘

```
+------------------------------+      +--------------------+
|        Brick Package         |      |     Micro App      |
| +---------+  +---------+     | ...  |  +--------------+  | ...
| | Brick A |  | Brick B | ... |      |  |  Storyboard  |  |
| +---------+  +---------+     |      |  +--------------+  |
+------------------------------+      +--------------------+

+---------------------------------------------------------------+
|                      Easy Bricks Core                         |
+---------------------------------------------------------------+
```

- *构件包*负责定义可重用的*构件*。构件和组件类似，但是有更高度的封装，并且可以很容易地通过声明的方式消费它们，无需编程。事实上，构件就是 [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)。构件可以是业务无关的、小的 UI 组件，也可以是包含业务特性的、大型的组件。

- *微应用*由构件组装而来，构件如何组装定义在一个 _Storyboard_ 中。Storyboard 可以用一个 YAML 或 JSON 配置，也可以通过可视化工具编排出来。

- _Easy Bricks Core_ 负责解析微应用的 storyboards，并按照定义装载相应的构件。

- 所有的构件包和微应用都可以独立部署。它们就像插件一样工作。可以看看真实世界中的例子：在仓库 [easyops-cn/next-basics](https://github.com/easyops-cn/next-basics) 中的[构件包](https://github.com/easyops-cn/next-basics/tree/master/bricks)和[微应用](https://github.com/easyops-cn/next-basics/tree/master/micro-apps)。

如果使用 Easy Bricks，通过我们提供的开箱即用的数百个构件，即使是只有少量编程技巧的用户，也可以在短短几天、甚至几小时内从头搭建一个应用出来。

另一方面，高级开发者也可以创建自己的构件，以满足复杂的业务需求。

## 路线图

- 2021 年第一季度:
  - [x] 开源构件框架 _Easy Bricks Core_ 和一些基本构件包；
  - [ ] 发布可视化编排 _Easy MA Builder_ Docker 镜像，包含服务端组件；
  - [ ] 文档站点；
  - [ ] 微应用市场。
- 2021 年第二季度:
  - [ ] 针对微应用的自动化测试能力；
  - [ ] 在 Easy MA Builder 上集成代码开发能力（针对高级开发者）。

_Easy MA Builder_ -- 可视化的微应用编排工具不久后就将公开，敬请期待。

![Visual builder](https://github.com/easyops-cn/next-demo/raw/master/assets/visual-builder.png)

## 贡献指南

请查看[贡献指南](./CONTRIBUTING.md)。

## 许可协议

Easy Bricks Core 使用 [GPL-3.0 协议](./COPYING)。
