# Brick Next Core

[![CI Status](https://github.com/easyops-cn/next-core/workflows/CI/badge.svg?event=push&branch=v3)](https://github.com/easyops-cn/next-core/actions?query=workflow%3ACI+branch%3Av3)
[![Coverage Status](https://codecov.io/gh/easyops-cn/next-core/branch/v3/graph/badge.svg?token=XSPIZ7X5WH)](https://app.codecov.io/gh/easyops-cn/next-core/tree/v3)
[![Cypress Status](https://img.shields.io/endpoint?url=https://dashboard.cypress.io/badge/simple/67qbbe/v3&style=flat&logo=cypress)](https://dashboard.cypress.io/projects/67qbbe/runs)

[English](#readme) | [简体中文](#简体中文)

## Introduction

[_Brick Next_](https://brick-next.js.org) is a low-code engine library based on [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components), for building highly-pluggable and highly-configurable enterprise user interface solutions.

The front-end of UWinTech's brand new DevOps platform _EasyOps_ is fully built on Brick Next. Hundreds of micro-apps are rapidly and continuously delivered to our enterprise clients. Building enterprise productivity tools has never been easier.

Want to give it a try? Check out our [tutorial](https://brick-next.js.org/docs/learn/tutorial).

Table of contents:

- [Brick Next Under the Hood](#brick-next-under-the-hood)
- [Contributing](#contributing)
- [License](#license)

## Brick Next Under the Hood

```
+------------------------------+      +--------------------+
|        Brick Package         |      |     Micro App      |
| +---------+  +---------+     | ...  |  +--------------+  | ...
| | Brick A |  | Brick B | ... |      |  |  Storyboard  |  |
| +---------+  +---------+     |      |  +--------------+  |
+------------------------------+      +--------------------+

+---------------------------------------------------------------+
|                      Brick Next Core                         |
+---------------------------------------------------------------+
```

- _Brick packages_ define reusable _bricks_. Bricks are similar to components, but with more encapsulations, and can be easily consumed by declarations without programming. Actually bricks are [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components). Bricks can be business-free small UI components, and can be business-ful large components too.

- _Micro-apps_ are assembled from bricks by declaring a _Storyboard_. Storyboards can be defined by a YAML or JSON, or be made from a visualization tool.

- _Brick Next Core_ is responsible for parsing storyboards of micro-apps and mounting bricks accordingly.

- All brick packages and micro-apps are independently deployable. They work as plugins. Check out the [official brick library](https://github.com/easyops-cn/next-bricks/).

By using Brick Next, which provides hundreds of bricks out of the box, users with limited programming skills can build an app in days even in hours, from scratch 🍻.

On the other hand, advanced developers can also create their own bricks for complex businesses.

## Contributing

See [Contribution Guide](./CONTRIBUTING.md).

## License

Brick Next Core is [GPL-3.0 licensed](./COPYING).

## 简体中文

## 简介

[_Brick Next_](https://brick-next.js.org) 是一个基于 [Web Components](https://developer.mozilla.org/zh-CN/docs/Web/Web_Components) 的低代码引擎库，旨在提供一套高度插件化、高度可配置化的企业用户界面解决方案。

优维科技全新的 DevOps 平台 _EasyOps_ 的前端整个基于 Brick Next 搭建。数百个企业级的微应用得以快速地、持续地交付给我们的企业客户。搭建企业级生产力工具从未如此简单。

想试用一下？请查看我们的[教程](https://brick-next.js.org/zh/docs/learn/tutorial)。

目录：

- [Brick Next 揭秘](#brick-next-揭秘)
- [贡献指南](#贡献指南)
- [许可协议](#许可协议)

## Brick Next 揭秘

```
+------------------------------+      +--------------------+
|        Brick Package         |      |     Micro App      |
| +---------+  +---------+     | ...  |  +--------------+  | ...
| | Brick A |  | Brick B | ... |      |  |  Storyboard  |  |
| +---------+  +---------+     |      |  +--------------+  |
+------------------------------+      +--------------------+

+---------------------------------------------------------------+
|                      Brick Next Core                         |
+---------------------------------------------------------------+
```

- *构件包*负责定义可重用的*构件*。构件和组件类似，但是有更高度的封装，并且可以很容易地通过声明的方式消费它们，无需编程。事实上，构件就是 [Web Components](https://developer.mozilla.org/zh-CN/docs/Web/Web_Components)。构件可以是业务无关的、小的 UI 组件，也可以是包含业务特性的、大型的组件。

- *微应用*由构件组装而来，构件如何组装定义在一个 _Storyboard_ 中。Storyboard 可以用一个 YAML 或 JSON 配置，也可以通过可视化工具编排出来。

- _Brick Next Core_ 负责解析微应用的 storyboards，并按照定义装载相应的构件。

- 所有的构件包和微应用都可以独立部署。它们就像插件一样工作。可以看看[官方构件库](https://github.com/easyops-cn/next-bricks/)。

如果使用 Brick Next，通过我们提供的开箱即用的数百个构件，即使是只有少量编程技巧的用户，也可以在短短几天、甚至几小时内从头搭建一个应用出来。

另一方面，高级开发者也可以创建自己的构件，以满足复杂的业务需求。

## 贡献指南

请查看[贡献指南](./CONTRIBUTING-v3.md)。

## 许可协议

Brick Next Core 使用 [GPL-3.0 协议](./COPYING)。
