# Contribution Guide

项目为基于 [Lerna] + [Yarn Workspace] 的 Monorepo.

更多文档请查看 《[EasyOps 开发者 - Micro App](http://developers.162.d.easyops.local/micro-app/introduce.html)》

## 文件结构

项目包含两个多包工作区：

```bash
.
├── dll/*                 # <小产品>
├── packages              # <平台库>
    ├── brick-container   # 新 Console
    ├── brick-dll         # Vendors dll
    ├── brick-http        # Http 基础库
    ├── brick-kit         # 插件运行时
    ├── brick-scripts     # 用于构件开发的脚本工具
    └── sdk-scripts       # 用于 SDK 的脚本工具
```

- `dll/*`'s scope is `@dll`
- `packages/*`'s scope is `@easyops`

## 关于 Storyboard

Storyboard 类似于老 Console 的小产品路由骨架，它负责定义页面路由结构、每个路由包含的构件、构件的属性和事件行为等。

路由的实现主要参考 [React-Router] 的[动态路由]，动态路由为我们提供了运行时配置路由的能力。

Storyboard 目前存放在 `packages/brick-container/conf/storyboards`，通常一个小产品对应一个 storyboard.json。配置格式定义请查阅 [](packages/brick-kit/src/interface/manifest.ts) 中的 `interface Storyboard`。

### 新增 Storyboard

在上述 storyboards 目录中新增一个 json 文件即可生效。

### Storyboard 原理

Storyboard 加载的主要逻辑请查看 [PluginRuntime::bootstrap()](packages/brick-kit/src/PluginRuntime.ts#L101)。

1. 启动监听 `history` 变化，每当有变化就执行渲染 `PluginRuntime::render()`。
2. 每次渲染将遍历所有 storyboard 的路由设置 `PluginRuntime::mountRoutes()`。
3. 每当路由匹配成功，就在对应的插口加载构件 `PluginRuntime::mountBricks()`。
4. 每个插口有两种类型的配置：`bricks` 和 `routes`，对于后者，将按照第 3 步继续匹配路由。

> 路由配置中的 `path` 使用 [path-to-regexp] 支持的格式。  
> 注：没有类似 ui-router 的 url 的父子继承关系。  
> 参考 React-Router 的 [Route.path] 实现，区别是目前不支持配置为数组。

> 路由配置中的 `exact` 表示路由是否精确匹配，与 React-Router 的 [Route.exact] 的功能一致。

> 路由配置中的 `switch` 表示仅渲染路由列表中第一个匹配到的路由，与 React-Router 的 [Switch] 的功能类似。

#### 事件配置

每个构件可以通过 `events` 字段配置事件行为，[结构定义](packages/brick-kit/src/interface/manifest.ts)如下：

```ts
export interface BrickEventsMap {
  [key: string]: BrickEventHandler;
}

export type BrickEventHandler =
  | BuiltinBrickEventHandler
  | CustomBrickEventHandler;

export interface BuiltinBrickEventHandler {
  action: "history.push" | "history.replace";
  args?: any[]; // Defaults to the event itself
}

export interface CustomBrickEventHandler {
  target: string; // The target element selector
  method: string; // The element's method
  multiple?: boolean; // Use `querySelectorAll` or `querySelector`
  args?: any[]; // Defaults to the event itself
}
```

对于内置事件处理器 BuiltinBrickEventHandler，目前仅提供两种 action：`history.push` 和 `history.replace` 用于链接的跳转。

如果不指定 `args`，则默认传递事件对象本身。

## 构件开发者中心

http://192.168.100.162/next/developers

### 添加构件示例

按构件库（如 @bricks/basic-bricks）添加示例配置文件 `bricks/developers/src/stories/chapters/*.ts`。

## Code Guidelines

请访问 [Wiki > Coding Guidelines](https://git.easyops.local/anyclouds/brick-next/wikis/coding-guidelines)。

## IDE

### VS Code

推荐插件：

- ESLint
- EditorConfig

推荐的项目级设置：

```json
{ "typescript.tsdk": "./node_modules/typescript/lib" }
```

> 该设置是为了激活 [css-modules] 的语法自动提示，请参考 [typescript-plugin-css-modules]。

## Nginx Configure

Production in local (For debugging production environment):

```conf
server {
    listen 8082;
    root /PATH/TO/next-core/packages/brick-container/dist;
    expires -1;
    location / {
        try_files $uri $uri/ /index.html;
        index index.html;
        ssi on;
    }
    location /conf/ {
        root /PATH/TO/next-core/packages/brick-container/;
    }
    location /bricks/ {
        root /PATH/TO/next-core/;
    }
    location /api/ {
        proxy_pass http://brick-next.162.d.easyops.local;
    }
}
```

Production on 162:

```conf
server {
    listen 80;
    server_name brick-next.162.d.easyops.local;
    root /usr/local/easyops/brick_next/packages/brick-container/dist;
    expires -1;

    set $base_href '/';
    if ($http_x_base_href) {
        set $base_href '/next/';
    }

    location / {
        try_files $uri $uri/ /index.html;
        index index.html;
        ssi on;
    }
    location /conf/ {
        root /usr/local/easyops/brick_next/packages/brick-container;
    }
    location /bricks/ {
        root /usr/local/easyops/brick_next/;
    }
    location /api/ {
        proxy_pass http://127.0.0.1:8104;
    }
}
```

[lerna]: https://github.com/lerna/lerna
[yarn workspace]: https://yarnpkg.com/lang/en/docs/workspaces/
[react-router]: https://reacttraining.com/react-router/
[动态路由]: https://reacttraining.com/react-router/core/guides/philosophy/dynamic-routing
[path-to-regexp]: https://github.com/pillarjs/path-to-regexp
[route.path]: https://reacttraining.com/react-router/web/api/Route/path-string-string
[route.exact]: https://reacttraining.com/react-router/web/api/Route/exact-bool
[switch]: https://reacttraining.com/react-router/web/api/Switch
[css-modules]: https://github.com/css-modules/css-modules
[typescript-plugin-css-modules]: https://github.com/mrmckeb/typescript-plugin-css-modules
