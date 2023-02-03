# Contribution Guide for Brick Next V3

## 说明

V3 废弃了一些核心包，包括但不限于：

```bash
- brick-dll, @dll/*
- brick-kit
- brick-utils
- rollup-config-factory
- webpack-config-factory
- build-config-factory
- custom-antd-styles
- editor-bricks-helper
- fontawesome-library
```

新增了一些包，包括但不限于：

```bash
- runtime            # 相当于新的 brick-kit
- utils              # 相当于新的 brick-utils
- loader             # 构件资源文件加载器
- element            # 构件基础库，包括自定义元素基类和属性事件装饰器等
- react-element      # 基于 React 的构件基础库
- react-use-brick    # 基于 React 的 UseBrick 实现
- brick-playground   # 用于开发调试构件（脱离核心框架）
- build-next-bricks  # 打包器，用于构件包、brick-container 和 brick-playground
```

## 构件开发

### Brick Playground

开始新的构件开发前，可以先将 brick-playground 跑起来。

1. `yarn`
2. `npx lerna run build --scope '@next-bricks/*'`
3. `npx lerna run build --scope @next-core/brick-playground`
4. `npx lerna run serve --scope @next-core/brick-playground`
5. 打开浏览器访问 `http://localhost:8082/`

在左侧 HTML 一栏内输入：

```html
<basic.demo-button label="Hello, ">world</basic.demo-button>
```

点击右侧 Preview 一栏的 `Run`，则可以在预览区中看到渲染结果。

在左侧 JavaScript 一栏内输入：

```javascript
const button = document.querySelector("basic\\.demo-button");
button.label = "Hi, ";
```

再次点击 `Run`，可以看到不同的结果。

在 Brick Next V3 中，构件按标准的自定义元素开发，并且可以脱离我们的核心框架运行，因此也按标准的自定义元素来开发和调试构件。

对于简单属性（`string|number|boolean`）可以直接在 HTML 中定义，而对于复合属性，可以在 JavaScript 中设置。

### 新构件

参考 `bricks/basic` 实现。

可以先拷贝以下文件：

```bash
build.config.js
package.json
tsconfig.json
src/index.ts
src/bootstrap.ts
```

然后运行 `yarn`。

新构件参考 `bricks/basic/src/general-button` 实现。

注意：

- 由于我们采用了 [Module Federation](https://webpack.js.org/concepts/module-federation/)，构件文件需要在 `src/bootstrap.ts` 中引入。
- 由于我们采用了 [Pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)，相对文件的引入需要使用完整路径并携带扩展名（但 ts/tsx 扩展实际需要写成 js），VS Code 的 import 补全能力可以按预期正常工作，其他 IDE 未知。
- 如果构件基于 `ReactNextElement`，其 `render()` 函数应直接返回一个 `JSX.Element`。
- 目前 `ReactNextElement` 仅支持 ShadowDOM 模式，样式文件需要使用 `*.shadow.css` 并在 `@defineElement` 中通过 `styleTexts` 传递进去。
- 一次 `createDecorators()` 调用返回的装饰器，只能用于一个构件。
- `@property()` 和 `@event()` 装饰器需要添加 [`accessor`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#a-nameauto-accessors-in-classes-auto-accessors-in-classes) 关键字，其中 `@event()` 需要使用 private 形式例如 `#clickEvent`。
- 通常来说，构件的主插槽不要有名字，以便支持 TextNode 作为构件的子节点，同时方便 Visual Builder 做相关优化（作为默认插槽）。
- 运行 lerna 命令时，最好始终加上 `npx` 来运行。

### 预览和调试

参考前一章节启动 Brick Playground，然后可以启动构件的实时打包 `npx lerna run start --scope @next-bricks/basic`。

## 框架核心能力

- [x] Router
- [x] Expressions (Partial)
- [x] Placeholders (transform and inject)
- [x] Context
- [x] Storyboard Functions
- [x] Brick Properties / Slots
- [x] Brick Events (Partial)
- [x] Custom Processors
- [x] checkPermissions
- [ ] Full Support for Expressions
- [ ] Full Support for Brick Events
- [ ] Custom Templates
- [ ] Brick Life Cycle
- [ ] UseBrick
- [ ] Menu
- [ ] Flow API
- [ ] Icons
- [ ] I18n
- [ ] Form Renderer
