# Storyboard 到 React 组件转换指南

## 📖 文档信息

| 项目         | 内容                      |
| ------------ | ------------------------- |
| **文档版本** | v1.0                      |
| **创建日期** | 2026-01-22                |
| **目标读者** | AI 大模型、前端开发工程师 |
| **适用范围** | Brick Next V3 框架        |
| **文档状态** | 完整版                    |

---

## 目录

- [第一部分: 文档概述与使用说明](#第一部分-文档概述与使用说明)
- [第二部分: 核心转换原则](#第二部分-核心转换原则)
- [第三部分: 语法映射表](#第三部分-语法映射表)
- [第四部分: 详细转换规则与示例](#第四部分-详细转换规则与示例)
- [第五部分: 完整示例对比](#第五部分-完整示例对比)
- [第六部分: API 对照表](#第六部分-api-对照表)
- [第七部分: 特殊场景处理](#第七部分-特殊场景处理)
- [第八部分: 转换注意事项与最佳实践](#第八部分-转换注意事项与最佳实践)
- [第九部分: 快速参考卡片](#第九部分-快速参考卡片)
- [第十部分: 附录](#第十部分-附录)
- [第十一部分: 转换工作流](#第十一部分-转换工作流)

---

# 第一部分: 文档概述与使用说明

## 1.1 文档目标

本文档旨在指导 **AI 大模型**(如 Claude、GPT 等)和**前端开发工程师**将 Brick Next 框架的 **Storyboard 编排配置**(通常为 `storyboard.json` 或 `route.yaml`)准确、高效地转换为 **React 组件**。

### 核心价值

1. **自动化转换**: 为 AI 提供清晰的转换规则和示例
2. **一致性保证**: 确保所有转换遵循统一的模式和最佳实践
3. **完整性保证**: 覆盖所有 Storyboard 特性的转换场景
4. **参考手册**: 作为开发人员的技术参考文档

## 1.2 目标读者

### AI 大模型

- 用于自动化代码转换
- 需要结构化、清晰的规则和示例
- 需要决策树辅助判断

### 前端开发工程师

- 理解转换原理和模式
- 手动转换或验证 AI 转换结果
- 解决复杂场景和边界情况

## 1.3 适用场景

本文档适用于以下转换场景:

1. **路由页面转换**: 将一个完整的路由配置(包含多个构件)转换为一个 React 组件
2. **构件渲染转换**: 将单个构件配置转换为 React 元素
3. **数据流转换**: 将 Context 配置转换为 React 状态管理
4. **事件处理转换**: 将事件处理器配置转换为 React 事件处理函数
5. **生命周期转换**: 将构件生命周期转换为 React Hooks

## 1.4 快速索引

| 需要转换的内容                          | 跳转章节                                                   |
| --------------------------------------- | ---------------------------------------------------------- |
| 构件渲染 (`brick`)                      | [§4.1](#41-构件渲染基础)                                   |
| 构件别名 (`brick` 使用 alias)           | [§4.1.5](#415-构件别名-alias-处理)                         |
| 动态属性 (`properties` with `<% %>`)    | [§4.2](#42-动态属性处理)                                   |
| 系统信息 (`SYS.username`, `SYS.org` 等) | [§4.2.4](#424-系统信息访问-sys)                            |
| 插槽 (`slots`)                          | [§4.3](#43-插槽转换)                                       |
| 条件渲染 (`if`)                         | [§4.4](#44-条件渲染)                                       |
| Context 自由变量                        | [§5.1](#51-context-自由变量)                               |
| Context 异步 resolve                    | [§5.2](#52-context-异步-resolve)                           |
| Context track (同步计算)                | [§5.3.1-5.3.2](#531-基本用法)                              |
| Context 依赖链 (异步数据追踪)           | [§5.3.3](#533-context-依赖链---异步数据追踪)               |
| Context onChange                        | [§5.4](#54-context-onchange)                               |
| 模板 state (expose: true/默认)          | [§5.5.1](#551-受控模式-expose-true-或默认)                 |
| 模板 state (expose: false)              | [§5.5.2](#552-非受控模式-expose-false)                     |
| state.onChange                          | [§5.5.3](#553-stateonchange---状态变化监听)                |
| state.update                            | [§5.5.4](#554-stateupdate---状态更新)                      |
| state vs context 对比                   | [§5.5.5](#555-state-vs-context-对比)                       |
| 内置 action 事件                        | [§6.1](#61-内置-action-事件)                               |
| useProvider 事件                        | [§6.2](#62-useprovider-事件)                               |
| handleHttpError 错误处理                | [§6.2.4](#624-handlehttperror---统一错误处理)              |
| 自定义构件方法调用                      | [§6.3](#63-自定义构件方法调用)                             |
| 设置构件属性                            | [§6.4](#64-设置构件属性)                                   |
| 事件条件处理                            | [§6.5](#65-事件条件处理)                                   |
| 事件链和回调                            | [§6.6](#66-事件链和回调)                                   |
| onMount 生命周期                        | [§7.1](#71-onmount-生命周期)                               |
| onUnmount 生命周期                      | [§7.2](#72-onunmount-生命周期)                             |
| onPageLoad 等页面生命周期               | [§7.3](#73-页面生命周期)                                   |
| lifeCycle.useResolves                   | [§7.3.4](#734-lifecycleuseresolves---构件生命周期数据加载) |
| onScrollIntoView                        | [§7.4](#74-onscrollintoview)                               |
| 完整示例                                | [第五部分](#第五部分-完整示例对比)                         |
| API 对照表                              | [第六部分](#第六部分-api-对照表)                           |
| 特殊场景                                | [第七部分](#第七部分-特殊场景处理)                         |

## 1.5 转换流程总览

```
┌─────────────────────────────────────────┐
│  输入: Storyboard 配置 (YAML/JSON)       │
│  - RouteConf (路由配置)                  │
│  - BrickConf (构件配置)                  │
│  - ContextConf (上下文配置)              │
│  - BrickEventsMap (事件配置)             │
│  - BrickLifeCycle (生命周期配置)         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  转换步骤                                │
│  1. 分析 Context → 生成 State/Provider   │
│  2. 分析 Bricks → 生成 JSX               │
│  3. 分析 Events → 生成事件处理函数        │
│  4. 分析 LifeCycle → 生成 useEffect      │
│  5. 处理动态表达式 → 转换为 JS 表达式     │
│  6. 处理条件渲染 → 转换为条件表达式       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  输出: React 组件 (TSX)                  │
│  - 导入语句                              │
│  - 类型定义                              │
│  - 函数组件定义                          │
│  - Hooks 调用                            │
│  - 事件处理函数                          │
│  - JSX 渲染                              │
└─────────────────────────────────────────┘
```

## 1.6 文档约定

### 代码标记

- `Storyboard 配置`: 使用 YAML 格式展示
- `React 代码`: 使用 TypeScript + JSX (TSX) 格式展示
- `注释`: 关键转换点使用中文注释说明

### 符号说明

- ✅ 推荐的转换方式
- ⚠️ 需要注意的事项
- ❌ 不推荐的转换方式
- 💡 提示和技巧

### 引用格式

- `§4.1` 表示跳转到第 4 部分第 1 小节
- `packages/types/src/manifest.ts:523` 表示文件路径和行号

---

# 第二部分: 核心转换原则

## 2.1 基本转换策略

### 2.1.1 从声明式到命令式

**Storyboard 是声明式的配置**,描述"要什么":

```yaml
context:
  - name: userName
    value: "张三"
```

**React 是命令式的代码**,描述"怎么做":

```tsx
const [userName, setUserName] = useState("张三");
```

### 2.1.2 转换核心原则

| 原则                    | 说明                             | 示例                                      |
| ----------------------- | -------------------------------- | ----------------------------------------- |
| **保持语义等价**        | 转换后的行为必须与原配置完全一致 | 事件触发时机、数据流向不变                |
| **优先静态化**          | 能用静态代码的不用动态渲染       | 优先使用 `wrapBrick` 而非 `ReactUseBrick` |
| **类型安全**            | 尽可能添加 TypeScript 类型       | 为 props、state 添加类型定义              |
| **遵循 React 最佳实践** | 使用标准的 React 模式            | 正确使用 Hooks、避免副作用                |
| **保持可读性**          | 代码清晰、易于理解和维护         | 合理的变量命名、适当的注释                |

## 2.2 转换决策树

### 2.2.1 构件渲染决策树

```
需要渲染构件?
├─ 构件名是否固定?
│  ├─ 是 → 构件属性是否固定?
│  │  ├─ 是 → ✅ 使用 wrapBrick (推荐)
│  │  │
│  │  │      构件事件名包含点号(.)或自定义名称?
│  │  │      ├─ 是 → 使用完整模式 (4 个泛型 + 事件映射)
│  │  │      │      const WrappedMyBrick = wrapBrick<Element, Props, Events, EventsMapping>(
│  │  │      │        "my.brick",
│  │  │      │        { onVisibleChange: "visible.change" }
│  │  │      │      );
│  │  │      │
│  │  │      └─ 否 → 使用完整模式或简化模式
│  │  │             完整模式 (推荐，一致性更好):
│  │  │             const WrappedMyBrick = wrapBrick<Element, Props, Events, EventsMapping>(
│  │  │               "my.brick",
│  │  │               { onClick: "click" }
│  │  │             );
│  │  │
│  │  │             简化模式 (可选):
│  │  │             const WrappedMyBrick = wrapBrick<Element, Props>("my.brick");
│  │  │
│  │  └─ 否 → 属性是否需要动态计算?
│  │         ├─ 简单动态 → ✅ 使用 wrapBrick + 动态 props
│  │         │      <WrappedMyBrick prop={dynamicValue} />
│  │         │
│  │         └─ 复杂动态 → 使用 ReactUseBrick
│  │                <ReactUseBrick useBrick={{ brick: "my.brick", properties: {...} }} />
│  │
│  └─ 否 → 使用 ReactUseBrick
│         const brickName = condition ? "brick.a" : "brick.b";
│         <ReactUseBrick useBrick={{ brick: brickName, ... }} />
│
└─ 构件是否需要按需加载?
   ├─ 是 → 使用 asyncWrapBrick
   │      const WrappedMyAsyncBrick = asyncWrapBrick("my.async-brick");
   │      <WrappedMyAsyncBrick />
   │
   └─ 否 → 使用 wrapBrick
```

**推荐给 AI 的统一策略**:
为保持转换一致性，建议 **统一使用完整模式** (4 个泛型)，即使对于标准事件也明确定义映射关系。这样：

- ✅ 代码结构一致，易于理解和维护
- ✅ 类型提示更完整，IDE 支持更好
- ✅ 减少决策分支，降低 AI 转换复杂度

### 2.2.2 数据管理决策树

```
Context 配置?
├─ 是否有 resolve 配置?
│  ├─ 否 → 自由变量
│  │      ├─ 值是否可变?
│  │      │  ├─ 是 → ✅ useState
│  │      │  │      const [myData, setMyData] = useState(initialValue);
│  │      │  │
│  │      │  └─ 否 → useMemo 或直接定义常量
│  │      │         const myData = useMemo(() => computeValue(), [deps]);
│  │      │
│  │      └─ 是否有 track 配置?
│  │         ├─ 是 → useState + useEffect (监听依赖变化)
│  │         └─ 否 → useState
│  │
│  └─ 是 → 异步数据
│         └─ ✅ useProvider
│                const { data, loading, error } = useProvider("provider-name", args);
│
└─ 是否有 onChange 配置?
   └─ 是 → useEffect (监听数据变化)
            useEffect(() => { /* onChange 逻辑 */ }, [myData]);
```

### 2.2.3 事件处理决策树

```
事件处理器?
├─ 是内置 action?
│  ├─ 是 → 直接调用对应的 Hook 或方法
│  │      ├─ history.push → useHistory().push(url)
│  │      ├─ context.assign → setState(prev => ({...prev, ...newData}))
│  │      ├─ message.success → useMessage().success(text)
│  │      └─ ...
│  │
│  └─ 否 → 是 useProvider?
│         ├─ 是 → ✅ useProvider + 手动调用
│         │      const { query } = useProvider("provider-name", null);
│         │      const handleEvent = async () => {
│         │        await query(args);
│         │      };
│         │
│         └─ 否 → 是自定义构件方法?
│                ├─ 是 → 使用 ref + 方法调用
│                │      const brickRef = useRef<BrickType>(null);
│                │      brickRef.current?.myMethod(args);
│                │
│                └─ 否 → 是设置构件属性?
│                       └─ 是 → 通过 state + props 传递
│                              setState(newValue);
│                              <MyBrick prop={state} />
│
└─ 是否有条件判断 (if)?
   ├─ 是 → 在事件处理函数中添加条件判断
   │      const handleEvent = () => {
   │        if (condition) {
   │          // 执行动作
   │        }
   │      };
   │
   └─ 否 → 直接执行
```

## 2.3 命名约定

### 2.3.1 变量命名

| Storyboard   | React        | 说明                   |
| ------------ | ------------ | ---------------------- |
| Context 名称 | State 变量名 | 保持一致或使用驼峰命名 |
| `myContext`  | `myContext`  | ✅ 保持原名            |
| `my_context` | `myContext`  | ✅ 转为驼峰            |
| `MyContext`  | `myContext`  | ✅ 首字母小写          |

### 2.3.2 函数命名

| 场景         | 命名模式                       | 示例                          |
| ------------ | ------------------------------ | ----------------------------- |
| 事件处理函数 | `handle[Event][Target]`        | `handleClickSubmit`           |
| 数据加载函数 | `load[Data]` 或 `fetch[Data]`  | `loadUserData`                |
| 数据提交函数 | `submit[Data]` 或 `save[Data]` | `submitForm`                  |
| 辅助函数     | 动词开头                       | `formatDate`, `validateInput` |

### 2.3.3 组件命名

| 类型        | 命名模式                        | 示例                                           |
| ----------- | ------------------------------- | ---------------------------------------------- |
| 包装的构件  | `Wrapped` + 大驼峰 (PascalCase) | `const WrappedMyBrick = wrapBrick("my.brick")` |
| 页面组件    | 大驼峰 + Page 后缀              | `UserListPage`, `ProductDetailPage`            |
| 自定义 Hook | `use` 前缀 + 大驼峰             | `useUserData`, `useFormValidation`             |

---

# 第三部分: 语法映射表

## 3.1 构件基础映射

| Storyboard 特性           | React 实现                    | 说明                         | 章节引用 |
| ------------------------- | ----------------------------- | ---------------------------- | -------- |
| **brick** (固定名称)      | `wrapBrick()`                 | 静态包装构件                 | §4.1.1   |
| **brick 实例 alias 字段** | JSX 注释 `{/* alias 内容 */}` | 构件实例标签 → 注释          | §4.1.5   |
| **brick** (动态名称)      | `<ReactUseBrick>`             | 动态渲染构件                 | §4.1.3   |
| **properties** (静态)     | React props                   | 直接传递                     | §4.1.1   |
| **properties** (动态)     | React props + 表达式          | 移除 `<% %>` 直接使用变量    | §4.2     |
| **slots**                 | React children / JSX          | 根据插槽类型转换             | §4.3     |
| **if** (简单条件)         | `{condition && <Component>}`  | 条件渲染                     | §4.4.1   |
| **if** (复杂条件)         | `{condition ? <A> : <B>}`     | 三元表达式                   | §4.4.2   |
| **portal**                | Portal 渲染                   | 使用 React Portal 或特殊处理 | §7.1     |
| **errorBoundary**         | Error Boundary                | 使用 React Error Boundary    | §7.2     |

## 3.2 数据与状态映射

| Storyboard 特性                         | React 实现                                    | 说明                     | 章节引用 |
| --------------------------------------- | --------------------------------------------- | ------------------------ | -------- |
| **context.name/value**                  | `useState()`                                  | 自由变量 → State         | §5.1     |
| **context.resolve**                     | `useProvider()`                               | 异步数据 → Provider Hook | §5.2     |
| **context.track**                       | `useState() + useEffect()`                    | 追踪依赖变化             | §5.3     |
| **context.onChange**                    | `useEffect()`                                 | 数据变化监听             | §5.4     |
| **context.if**                          | 条件初始化                                    | 条件判断后初始化 state   | §5.1     |
| **`<% CTX.xxx %>`**                     | `xxx`                                         | 直接使用变量             | §4.2     |
| **`<% APP.homepage %>`**                | `useCurrentApp().homepage`                    | 获取应用信息             | §6.1     |
| **`<% PATH.id %>`**                     | `usePathParams().id`                          | 获取路由参数             | §6.1     |
| **`<% QUERY.keyword %>`**               | `useParams().keyword`                         | 获取查询参数             | §6.1     |
| **`<% EVENT.detail %>`**                | 事件处理函数参数 `(event)`                    | 事件对象                 | §6.1     |
| **`<% PERMISSIONS.check("action") %>`** | `useCheckPermissions().check("action")`       | 权限校验                 | §6.1     |
| **`<% FLAGS.myFlag %>`**                | `useFeatureFlags().myFlag`                    | 特性开关                 | §6.1     |
| **`<% SYS.username %>`**                | `useSystemInfo().username`                    | 获取当前用户名           | §4.2.4   |
| **`<% SYS.org %>`**                     | `useSystemInfo().org`                         | 获取组织 ID              | §4.2.4   |
| **`<% SYS.userInstanceId %>`**          | `useSystemInfo().userInstanceId`              | 获取用户实例 ID          | §4.2.4   |
| **`<% SYS.isInIframe %>`**              | `useSystemInfo().isInIframe`                  | 是否在 iframe 中         | §4.2.4   |
| **`<% SYS.settings.brand.xxx %>`**      | `useSystemInfo().settings.brand.xxx`          | 品牌设置                 | §4.2.4   |
| **state (expose: true/默认)**           | `useControlledState(propValue, defaultValue)` | 模板受控状态             | §5.5     |
| **state (expose: false)**               | `useState(defaultValue)`                      | 模板内部状态             | §5.5     |
| **`<% STATE.xxx %>`**                   | `xxx`                                         | 访问模板状态             | §5.5     |
| **state.onChange**                      | `useEffect(() => { ... }, [stateVar])`        | 状态变化监听             | §5.5     |

## 3.3 事件处理映射

| Storyboard Action              | React 实现                           | 说明                                 | 章节引用 |
| ------------------------------ | ------------------------------------ | ------------------------------------ | -------- |
| **history.push**               | `useHistory().push(url)`             | 路由跳转                             | §6.1.1   |
| **history.pushQuery**          | `useHistory().pushQuery(query)`      | 更新查询参数                         | §6.1.1   |
| **history.goBack**             | `useHistory().goBack()`              | 返回上一页                           | §6.1.1   |
| **history.reload**             | `useHistory().reload()`              | 重新加载当前页                       | §6.1.1   |
| **context.assign**             | `setState(prev => ({...prev, ...}))` | 合并更新 state                       | §6.1.2   |
| **context.replace**            | `setState(newValue)`                 | 替换 state                           | §6.1.2   |
| **context.load**               | `useProvider().query()`              | 加载数据 (懒加载场景)                | §6.1.2   |
| **context.refresh**            | `useProvider().query()`              | 刷新数据                             | §6.1.2   |
| **state.update**               | `setState(newValue)`                 | 更新模板状态                         | §6.1.2   |
| **state.update (batch: true)** | 多次 `setState()`                    | 批量更新状态（React 18+ 自动批处理） | §6.1.2   |
| **message.success**            | `useMessage().success(text)`         | 成功提示                             | §6.1.3   |
| **message.error**              | `useMessage().error(text)`           | 错误提示                             | §6.1.3   |
| **message.info**               | `useMessage().info(text)`            | 信息提示                             | §6.1.3   |
| **message.warn**               | `useMessage().warn(text)`            | 警告提示                             | §6.1.3   |
| **localStorage.setItem**       | `localStorage.setItem(key, value)`   | 本地存储                             | §6.1.4   |
| **localStorage.removeItem**    | `localStorage.removeItem(key)`       | 移除本地存储                         | §6.1.4   |
| **sessionStorage.setItem**     | `sessionStorage.setItem(key, value)` | 会话存储                             | §6.1.4   |
| **sessionStorage.removeItem**  | `sessionStorage.removeItem(key)`     | 移除会话存储                         | §6.1.4   |
| **location.reload**            | `window.location.reload()`           | 刷新页面                             | §6.1.5   |
| **window.open**                | `window.open(url, target)`           | 打开新窗口                           | §6.1.5   |
| **console.log**                | `console.log(...)`                   | 控制台输出                           | §6.1.5   |
| **useProvider (事件)**         | `useProvider().query(args)`          | Provider 调用                        | §6.2     |
| **method (自定义构件方法)**    | `ref.current?.method(args)`          | 构件方法调用                         | §6.3     |
| **properties (设置构件属性)**  | 通过 state + props 传递              | 属性更新                             | §6.4     |
| **callback.success**           | `try-catch` 成功分支                 | 成功回调                             | §6.6     |
| **callback.error**             | `try-catch` 错误分支                 | 错误回调                             | §6.6     |
| **callback.finally**           | `try-catch-finally`                  | 最终回调                             | §6.6     |

## 3.4 生命周期映射

| Storyboard 生命周期            | React 实现                                      | 说明          | 章节引用 |
| ------------------------------ | ----------------------------------------------- | ------------- | -------- |
| **lifeCycle.onMount**          | `useEffect(() => { ... }, [])`                  | 组件挂载      | §7.1     |
| **lifeCycle.onUnmount**        | `useEffect(() => { return () => { ... } }, [])` | 组件卸载      | §7.2     |
| **lifeCycle.onPageLoad**       | `useEffect(() => { ... }, [])`                  | 页面加载      | §7.3.1   |
| **lifeCycle.onBeforePageLoad** | 在组件顶部或自定义 Hook                         | 页面加载前    | §7.3.2   |
| **lifeCycle.onPageLeave**      | `useEffect` return + 路由监听                   | 页面离开      | §7.3.3   |
| **lifeCycle.onAnchorLoad**     | `useEffect` + `useLocation`                     | URL hash 变化 | §7.3.4   |
| **lifeCycle.onScrollIntoView** | Intersection Observer API                       | 滚动进入视图  | §7.4     |

---

# 第四部分: 详细转换规则与示例

## 4.1 构件渲染基础

### 4.1.1 静态构件渲染 (wrapBrick) - 标准事件

**适用场景**: 构件名称和属性固定，使用标准 HTML 事件 (click, change, blur 等)

**完整转换示例：Storyboard → React**

#### Storyboard 配置 (YAML)

```yaml
brick: eo-button
alias: 提交按钮 # ← 构件实例的标识/注释
properties:
  type: primary
  text: 提交
  disabled: false
events:
  click: # ← Storyboard 事件名
    - action: console.log
      args: ["按钮被点击"]
```

#### React 转换代码

```tsx
import { wrapBrick } from "@next-core/react-element";

// 1️⃣ 定义 Props 类型 (只包含属性，不包含事件)
interface EoButtonProps {
  type?: "primary" | "default" | "dashed";
  text?: string;
  disabled?: boolean;
  loading?: boolean;
  // ❌ 不要在这里定义 onClick 等事件处理器
}

// 2️⃣ 定义事件类型 (可选，用于类型提示)
interface EoButtonEvents {
  click: MouseEvent; // 原生事件类型
}

// 3️⃣ 定义事件映射 (可选，标准事件可以省略)
interface EoButtonEventsMapping {
  onClick: "click"; // React 风格 → 原生事件名
}

// 4️⃣ 包装构件 (注意命名: Wrapped{组件名})
const WrappedEoButton = wrapBrick<HTMLElement, EoButtonProps>("eo-button");
// 或完整模式 (更清晰，推荐)：
// const WrappedEoButton = wrapBrick<
//   HTMLElement,
//   EoButtonProps,
//   EoButtonEvents,
//   EoButtonEventsMapping
// >("eo-button", {
//   onClick: "click",      // 映射配置
// });

// 5️⃣ 在组件中使用
function MyComponent() {
  // Storyboard events.click → React onClick 处理函数
  const handleClick = (event: MouseEvent) => {
    console.log("按钮被点击");
  };

  return (
    <>
      {/* 提交按钮 */}
      <WrappedEoButton
        type="primary" // properties.type → React props
        text="提交" // properties.text → React props
        disabled={false} // properties.disabled → React props
        onClick={handleClick} // events.click → React onClick
      />
    </>
  );
}
```

#### 转换映射关系

| Storyboard 配置            | React 代码              | 说明                            |
| -------------------------- | ----------------------- | ------------------------------- |
| `brick: eo-button`         | `WrappedEoButton`       | 构件名 → Wrapped{组件名}        |
| `alias: 提交按钮`          | `{/* 提交按钮 */}`      | **alias → JSX 注释**            |
| `properties.type: primary` | `type="primary"`        | 属性直接映射                    |
| `properties.text: 提交`    | `text="提交"`           | 属性直接映射                    |
| `events.click`             | `onClick={handleClick}` | **事件名映射: click → onClick** |
| `action: console.log`      | `console.log("...")`    | 动作转换为函数调用              |

**关键点**:

- ✅ 包装后的组件命名: `Wrapped{组件名}` (如 WrappedEoButton, WrappedEoInput)
- ✅ Storyboard 的 `alias` 字段 → JSX 注释 `{/* alias 内容 */}`
- ✅ Props 类型只定义属性,不定义事件处理器
- ✅ 标准 HTML 事件名会自动映射 (click → onClick, change → onChange)
- ✅ 简化模式适用于标准事件 (2 个泛型)
- ✅ 完整模式更清晰,建议 AI 统一使用完整模式 (4 个泛型)
- 💡 **事件映射规则**: Storyboard 的 `events.xxx` → React 的 `onXxx`

### 4.1.2 事件映射 - 自定义事件名

**适用场景**: 构件触发的事件名不是标准 HTML 事件 (如 `visible.change`, `action.click`)

**完整转换示例：Storyboard → React**

#### Storyboard 配置 (YAML)

```yaml
brick: eo-popover
properties:
  placement: bottom-start
  trigger: click
  active: false
events:
  visible.change: # ← 自定义事件名 (带点号)
    - action: console.log
      args: ["可见性变化:", "<% EVENT.detail %>"]
  before.visible.change: # ← 自定义事件名
    - action: context.assign
      args: [isPopoverVisible, "<% EVENT.detail %>"]

# 插槽中嵌套另一个构件
slots:
  "":
    type: bricks
    bricks:
      - brick: eo-actions
        properties:
          actions:
            - text: 操作1
            - text: 操作2
        events:
          action.click: # ← 自定义事件名
            - action: console.log
              args: ["操作被点击:", "<% EVENT.detail %>"]
```

#### React 转换代码

```tsx
import { wrapBrick } from "@next-core/react-element";

// 1️⃣ 定义 Popover Props 类型 (不含事件)
interface PopoverProps {
  placement?: "top" | "bottom" | "left" | "right" | "bottom-start";
  trigger?: "click" | "hover";
  active?: boolean;
}

// 2️⃣ 定义 Popover 原生事件类型
interface PopoverEvents {
  "visible.change": CustomEvent<boolean>; // 原生事件名和类型
  "before.visible.change": CustomEvent<boolean>;
}

// 3️⃣ 定义 Popover 事件映射类型
interface PopoverEventsMapping {
  onVisibleChange: "visible.change"; // React 风格 → 原生事件名
  onBeforeVisibleChange: "before.visible.change";
}

// 4️⃣ 包装 Popover 构件 (完整模式：4 个泛型 + 映射配置)
const WrappedPopover = wrapBrick<
  HTMLElement,
  PopoverProps,
  PopoverEvents,
  PopoverEventsMapping
>("eo-popover", {
  onVisibleChange: "visible.change", // 映射配置对象
  onBeforeVisibleChange: "before.visible.change",
});

// Actions 构件同理
interface ActionsProps {
  actions?: Array<{ text: string; [key: string]: any }>;
}

interface ActionsEvents {
  "action.click": CustomEvent<any>;
}

interface ActionsEventsMapping {
  onActionClick: "action.click";
}

const WrappedActions = wrapBrick<
  HTMLElement,
  ActionsProps,
  ActionsEvents,
  ActionsEventsMapping
>("eo-actions", {
  onActionClick: "action.click",
});

// 5️⃣ 在组件中使用
function MyComponent() {
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);

  // Storyboard events["visible.change"] → React onVisibleChange
  const handleVisibleChange = (e: CustomEvent<boolean>) => {
    console.log("可见性变化:", e.detail);
  };

  // Storyboard events["before.visible.change"] → React onBeforeVisibleChange
  const handleBeforeVisibleChange = (e: CustomEvent<boolean>) => {
    setIsPopoverVisible(e.detail);
  };

  // Storyboard events["action.click"] → React onActionClick
  const handleActionClick = (e: CustomEvent) => {
    console.log("操作被点击:", e.detail);
  };

  return (
    <WrappedPopover
      placement="bottom-start" // properties.placement
      trigger="click" // properties.trigger
      active={false} // properties.active
      onVisibleChange={handleVisibleChange} // events["visible.change"]
      onBeforeVisibleChange={handleBeforeVisibleChange} // events["before.visible.change"]
    >
      <WrappedActions
        actions={[{ text: "操作1" }, { text: "操作2" }]}
        onActionClick={handleActionClick} // events["action.click"]
      />
    </WrappedPopover>
  );
}
```

#### 转换映射关系

| Storyboard 事件配置               | React 代码                    | 说明                   |
| --------------------------------- | ----------------------------- | ---------------------- |
| `events["visible.change"]`        | `onVisibleChange={...}`       | **自定义事件需要映射** |
| `events["before.visible.change"]` | `onBeforeVisibleChange={...}` | 点号 → 驼峰命名        |
| `events["action.click"]`          | `onActionClick={...}`         | 点号 → 驼峰命名        |
| `EVENT.detail`                    | `e.detail`                    | 事件对象的 detail 属性 |

**事件命名规则**:

```
Storyboard 事件名              React 事件处理器名
─────────────────────        ────────────────────
visible.change         →     onVisibleChange
before.visible.change  →     onBeforeVisibleChange
action.click           →     onActionClick
item.drag.start        →     onItemDragStart

规则：
1. 添加 "on" 前缀
2. 将点号分隔的单词转为驼峰命名
3. 每个单词首字母大写
```

**何时需要完整的事件映射?**

| 事件类型             | 是否需要映射       | 示例                               |
| -------------------- | ------------------ | ---------------------------------- |
| 标准 HTML 事件       | ⚠️ 可选 (自动映射) | click → onClick, change → onChange |
| 带点号的自定义事件   | ✅ **必须映射**    | visible.change → onVisibleChange   |
| 驼峰命名的自定义事件 | ⚠️ 建议映射        | visibleChange → onVisibleChange    |

**AI 转换决策**:

```
Storyboard 事件名包含点号 (.) ?
├─ 是 (如 visible.change, action.click)
│  └─ ✅ 使用完整模式 (4 个泛型 + 事件映射)
│
└─ 否 (如 click, change, blur)
   └─ ⚠️ 可选：
       - 简化模式 (2 个泛型，自动映射)
       - 完整模式 (更清晰，推荐)
```

**推荐给 AI**: 为保持一致性，**统一使用完整模式** (4 个泛型)，即使是标准事件也明确定义映射关系。

### 4.1.3 动态构件渲染 (ReactUseBrick)

**适用场景**: 构件名称或大量属性需要动态计算

**Storyboard 配置**:

```yaml
brick: "<% CTX.brickType === 'button' ? 'eo-button' : 'eo-link' %>"
properties:
  text: "<% CTX.buttonText %>"
  type: primary
```

**React 转换**:

```tsx
import { ReactUseBrick, UseSingleBrickConf } from "@next-core/react-runtime";

function MyComponent() {
  const [brickType, setBrickType] = useState<"button" | "link">("button");
  const [buttonText, setButtonText] = useState("点击我");

  // 构建 useBrick 配置
  const useBrickConfig: UseSingleBrickConf = {
    brick: brickType === "button" ? "eo-button" : "eo-link",
    properties: {
      text: buttonText,
      type: "primary",
    },
  };

  return <ReactUseBrick useBrick={useBrickConfig} />;
}
```

**关键点**:

- ⚠️ 仅在必要时使用 `ReactUseBrick`,性能不如 `wrapBrick`
- ✅ 适用于构件名称动态变化的场景
- ✅ `UseSingleBrickConf` 类型定义来自 `@next-core/react-runtime`

### 4.1.4 按需加载构件 (asyncWrapBrick)

**适用场景**: 构件体积较大,需要按需加载

**Storyboard 配置**:

```yaml
brick: my.heavy-chart
properties:
  data: "<% CTX.chartData %>"
```

**React 转换**:

```tsx
import { asyncWrapBrick } from "@next-core/react-runtime";
import { Suspense } from "react";

// 异步包装构件 (注意命名: Wrapped{组件名})
const WrappedHeavyChart = asyncWrapBrick<HTMLElement, { data: any[] }>(
  "my.heavy-chart"
);

function MyComponent() {
  const [chartData, setChartData] = useState([]);

  return (
    <Suspense fallback={<div>加载中...</div>}>
      <WrappedHeavyChart data={chartData} />
    </Suspense>
  );
}
```

**关键点**:

- ✅ 使用 `asyncWrapBrick` 实现代码分割
- ✅ 必须配合 `Suspense` 使用
- ✅ 适用于大型图表、编辑器等重型构件

### 4.1.5 构件别名标签 (alias 字段) 处理

**适用场景**: Storyboard 中构件实例使用 `alias` 字段标注说明

**背景说明**:

- Storyboard 中的 `alias` 字段是对**构件实例**的标签或说明
- 类似于代码中的注释，用于描述构件的业务含义
- 在 React 转换中，应该转换为 JSX 注释

**完整转换示例：Storyboard → React**

#### Storyboard 配置 (使用 alias 字段)

```yaml
brick: eo-text
alias: 收货地址 # ← alias 字段：对这个构件实例的说明
properties:
  type: secondary
  textContent: "<% CTX.shippingAddress %>"

---
brick: eo-button
alias: 提交订单按钮 # ← alias 字段：按钮的业务含义
properties:
  type: primary
  text: 提交订单
events:
  click:
    - action: console.log
```

#### React 转换代码

```tsx
import { wrapBrick } from "@next-core/react-element";

interface EoTextProps {
  type?: "default" | "secondary" | "success" | "warning" | "danger";
  textContent?: string;
}

interface EoButtonProps {
  type?: "default" | "primary" | "secondary";
  text?: string;
}

// 包装构件 (注意命名: Wrapped{组件名})
const WrappedEoText = wrapBrick<HTMLElement, EoTextProps>("eo-text");
const WrappedEoButton = wrapBrick<HTMLElement, EoButtonProps>("eo-button");

function MyComponent() {
  const [shippingAddress, setShippingAddress] = useState("");

  const handleSubmit = () => {
    console.log("提交订单");
  };

  return (
    <>
      {/* 收货地址 */}
      <WrappedEoText type="secondary" textContent={shippingAddress} />

      {/* 提交订单按钮 */}
      <WrappedEoButton type="primary" text="提交订单" onClick={handleSubmit} />
    </>
  );
}
```

#### 转换规则

| Storyboard 配置       | React 代码             | 说明                     |
| --------------------- | ---------------------- | ------------------------ |
| `brick: eo-text`      | `WrappedEoText`        | 构件名 → Wrapped{组件名} |
| `alias: 收货地址`     | `{/* 收货地址 */}`     | **alias → JSX 注释**     |
| `alias: 提交订单按钮` | `{/* 提交订单按钮 */}` | **alias → JSX 注释**     |

**关键点**:

- ✅ **alias 字段转换为 JSX 注释 `{/* alias 内容 */}`**
- ✅ 注释放在对应的 JSX 元素**正上方**
- ✅ 保留 alias 的原始文本，不做修改
- 💡 alias 有助于理解业务逻辑，应完整保留

**AI 转换模板**:

```tsx
// Storyboard:
// brick: eo-xxx
// alias: 某个说明
// properties: {...}

// React:
{
  /* 某个说明 */
}
<WrappedEoXxx {...props} />;
```

**注意事项**:

- ⚠️ 如果 Storyboard 中没有 `alias` 字段，则不需要添加注释
- ⚠️ alias 可以是任意文本，包括中文、英文、符号等
- ✅ alias 注释应紧贴构件元素，不要有空行

## 4.2 动态属性处理

### 4.2.1 简单动态属性

**Storyboard 配置**:

```yaml
brick: eo-input
properties:
  placeholder: "<% CTX.inputPlaceholder %>"
  value: "<% CTX.inputValue %>"
  disabled: "<% CTX.isDisabled %>"
```

**React 转换**:

```tsx
const WrappedEoInput = wrapBrick<
  HTMLElement,
  {
    placeholder?: string;
    value?: string;
    disabled?: boolean;
  }
>("eo-input");

function MyComponent() {
  const [inputPlaceholder, setInputPlaceholder] = useState("请输入");
  const [inputValue, setInputValue] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);

  return (
    <WrappedEoInput
      placeholder={inputPlaceholder}
      value={inputValue}
      disabled={isDisabled}
    />
  );
}
```

**关键点**:

- ✅ 移除 `<% %>` 模板语法,直接使用 JavaScript 变量
- ✅ Storyboard 中的 `CTX.xxx` 对应 React 中的 state 变量 `xxx`

### 4.2.2 复杂表达式

**Storyboard 配置**:

```yaml
brick: eo-button
properties:
  text: "<% CTX.count > 0 ? `已选择 ${CTX.count} 项` : '请选择' %>"
  disabled: "<% CTX.count === 0 || CTX.loading %>"
```

**React 转换**:

```tsx
const WrappedEoButton = wrapBrick<
  HTMLElement,
  {
    text?: string;
    disabled?: boolean;
  }
>("eo-button");

function MyComponent() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 计算属性值
  const buttonText = count > 0 ? `已选择 ${count} 项` : "请选择";
  const isDisabled = count === 0 || loading;

  return <WrappedEoButton text={buttonText} disabled={isDisabled} />;
}
```

**关键点**:

- ✅ 将复杂表达式提取为变量,提高可读性
- ✅ 可以使用 `useMemo` 优化复杂计算

### 4.2.3 访问全局对象

**Storyboard 配置**:

```yaml
brick: eo-link
properties:
  url: "<% APP.homepage + '/detail/' + PATH.id %>"
  text: "<% QUERY.keyword || '查看详情' %>"
```

**React 转换**:

```tsx
import {
  useCurrentApp,
  useParams,
  usePathParams,
} from "@next-core/react-runtime";

const WrappedEoLink = wrapBrick<
  HTMLElement,
  {
    url?: string;
    text?: string;
  }
>("eo-link");

function MyComponent() {
  const app = useCurrentApp();
  const { id } = usePathParams<{ id: string }>();
  const { keyword } = useParams<{ keyword: string }>();

  const linkUrl = `${app.homepage}/detail/${id}`;
  const linkText = keyword || "查看详情";

  return <WrappedEoLink url={linkUrl} text={linkText} />;
}
```

**关键点**:

- ✅ 使用对应的 Hook 获取全局对象
- ✅ 参见 [§3.2 数据与状态映射](#32-数据与状态映射) 了解完整的全局对象映射

### 4.2.4 系统信息访问 (SYS)

**适用场景**: 访问系统级信息（用户、组织、页面状态、品牌设置等）

**Storyboard 配置**:

```yaml
brick: eo-input
properties:
  placeholder: "<% SYS.username %>"
  addonAfter: ".<% SYS.org %>"

brick: eo-text
properties:
  textContent: "<% SYS.settings.brand.base_title %>"
if: "<% SYS.isInIframe %>"
```

**React 转换**:

```tsx
import { useSystemInfo } from "@next-core/react-runtime";

const WrappedEoInput = wrapBrick<
  HTMLElement,
  {
    placeholder?: string;
    addonAfter?: string;
  }
>("eo-input");

const WrappedEoText = wrapBrick<
  HTMLElement,
  {
    textContent?: string;
  }
>("eo-text");

function MyComponent() {
  const sys = useSystemInfo();

  return (
    <>
      <WrappedEoInput placeholder={sys.username} addonAfter={`.${sys.org}`} />

      {sys.isInIframe && (
        <WrappedEoText textContent={sys.settings.brand.base_title} />
      )}
    </>
  );
}
```

**SystemInfo 接口定义**:

```typescript
interface SystemInfo {
  // 用户信息
  username?: string; // 当前用户名
  userInstanceId?: string; // 用户实例 ID
  org?: number; // 组织 ID

  // 页面状态
  isInIframe?: boolean; // 是否在 iframe 中运行
  isInIframeOfNext?: boolean; // 是否在 next 的 iframe 中

  // 系统设置
  settings: {
    brand: Record<string, string>; // 品牌设置 (如 base_title)
  };
}
```

**常用 SYS 字段映射**:

| Storyboard SYS 字段                   | React 代码                      | 说明             |
| ------------------------------------- | ------------------------------- | ---------------- |
| `<% SYS.username %>`                  | `sys.username`                  | 当前用户名       |
| `<% SYS.org %>`                       | `sys.org`                       | 组织 ID          |
| `<% SYS.userInstanceId %>`            | `sys.userInstanceId`            | 用户实例 ID      |
| `<% SYS.isInIframe %>`                | `sys.isInIframe`                | 是否在 iframe 中 |
| `<% SYS.settings.brand.base_title %>` | `sys.settings.brand.base_title` | 品牌标题         |

**关键点**:

- ✅ `useSystemInfo()` 返回的对象引用稳定，使用 `useMemo` 确保不会导致不必要的重渲染
- ✅ 系统信息在会话期间保持稳定，不会频繁变化
- ✅ 可以安全地在依赖数组中使用 `sys` 的各个属性
- ⚠️ 所有字段都是可选的，使用时需要考虑 undefined 情况

## 4.3 插槽转换

### 4.3.1 默认插槽 (children)

**Storyboard 配置**:

```yaml
brick: eo-card
slots:
  "": # 默认插槽 (空字符串)
    type: bricks
    bricks:
      - brick: eo-button
        properties:
          text: 按钮1
      - brick: eo-button
        properties:
          text: 按钮2
```

**React 转换**:

```tsx
const WrappedEoCard = wrapBrick<HTMLElement, any>("eo-card");
const WrappedEoButton = wrapBrick<HTMLElement, { text?: string }>("eo-button");

function MyComponent() {
  return (
    <WrappedEoCard>
      <WrappedEoButton text="按钮1" />
      <WrappedEoButton text="按钮2" />
    </WrappedEoCard>
  );
}
```

**关键点**:

- ✅ 默认插槽转换为 React children
- ✅ 子构件列表转换为多个 JSX 元素

### 4.3.2 命名插槽

**Storyboard 配置**:

```yaml
brick: eo-modal
properties:
  visible: true
slots:
  header:
    type: bricks
    bricks:
      - brick: eo-title
        properties:
          text: 标题
  content:
    type: bricks
    bricks:
      - brick: eo-input
        properties:
          placeholder: 请输入
  footer:
    type: bricks
    bricks:
      - brick: eo-button
        properties:
          text: 确定
```

**React 转换**:

```tsx
const WrappedEoModal = wrapBrick<HTMLElement, { visible?: boolean }>(
  "eo-modal"
);
const WrappedEoTitle = wrapBrick<HTMLElement, { text?: string }>("eo-title");
const WrappedEoInput = wrapBrick<HTMLElement, { placeholder?: string }>(
  "eo-input"
);
const WrappedEoButton = wrapBrick<HTMLElement, { text?: string }>("eo-button");

function MyComponent() {
  return (
    <WrappedEoModal visible={true}>
      {/* 命名插槽需要使用特殊的 slot 属性 */}
      <WrappedEoTitle slot="header" text="标题" />
      <WrappedEoInput slot="content" placeholder="请输入" />
      <WrappedEoButton slot="footer" text="确定" />
    </WrappedEoModal>
  );
}
```

**关键点**:

- ✅ 命名插槽通过 `slot` 属性指定
- ✅ Web Components 的标准 slot 机制
- ⚠️ 某些构件可能使用不同的 slot 命名约定,需要查看构件文档

### 4.3.3 条件插槽

**Storyboard 配置**:

```yaml
brick: eo-card
slots:
  extra:
    type: bricks
    bricks:
      - brick: eo-button
        properties:
          text: 编辑
        if: "<% CTX.canEdit %>"
```

**React 转换**:

```tsx
const WrappedEoCard = wrapBrick("eo-card");
const WrappedEoButton = wrapBrick<HTMLElement, { text?: string }>("eo-button");

function MyComponent() {
  const [canEdit, setCanEdit] = useState(false);

  return (
    <WrappedEoCard>
      {canEdit && <WrappedEoButton slot="extra" text="编辑" />}
    </WrappedEoCard>
  );
}
```

**关键点**:

- ✅ 使用条件表达式控制插槽内容的渲染

## 4.4 条件渲染

### 4.4.1 简单条件 (if)

**Storyboard 配置**:

```yaml
brick: eo-button
properties:
  text: 删除
if: "<% CTX.canDelete %>"
```

**React 转换**:

```tsx
const WrappedEoButton = wrapBrick<HTMLElement, { text?: string }>("eo-button");

function MyComponent() {
  const [canDelete, setCanDelete] = useState(false);

  return <>{canDelete && <WrappedEoButton text="删除" />}</>;
}
```

**关键点**:

- ✅ 使用 `&&` 逻辑运算符实现条件渲染
- ✅ 条件为 `false` 时不渲染该元素

### 4.4.2 条件选择 (if-else)

**Storyboard 配置**:

```yaml
# 需要通过多个构件配置实现
- brick: eo-button
  properties:
    text: 编辑
  if: "<% CTX.isEditing %>"

- brick: eo-button
  properties:
    text: 查看
  if: "<% !CTX.isEditing %>"
```

**React 转换**:

```tsx
const WrappedEoButton = wrapBrick<HTMLElement, { text?: string }>("eo-button");

function MyComponent() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      {isEditing ? (
        <WrappedEoButton text="编辑" />
      ) : (
        <WrappedEoButton text="查看" />
      )}
    </>
  );
}
```

**关键点**:

- ✅ 使用三元表达式实现二选一渲染
- ✅ 代码更简洁清晰

### 4.4.3 权限条件渲染

**Storyboard 配置**:

```yaml
brick: eo-button
properties:
  text: 删除
if: "<% PERMISSIONS.check('user:delete') %>"
```

**React 转换**:

```tsx
import { useCheckPermissions } from "@next-core/react-runtime";

const WrappedEoButton = wrapBrick<HTMLElement, { text?: string }>("eo-button");

function MyComponent() {
  const permissions = useCheckPermissions();
  const canDelete = permissions.check("user:delete");

  return <>{canDelete && <WrappedEoButton text="删除" />}</>;
}
```

**关键点**:

- ✅ 使用 `useCheckPermissions` Hook 获取权限校验函数
- ✅ 权限判断结果可以缓存到 state 中

### 4.4.4 复杂条件渲染

**Storyboard 配置**:

```yaml
brick: eo-button
properties:
  text: 提交
if: "<% CTX.formValid && !CTX.loading && PERMISSIONS.check('form:submit') %>"
```

**React 转换**:

```tsx
import { useCheckPermissions } from "@next-core/react-runtime";
import { useMemo } from "react";

const WrappedEoButton = wrapBrick<HTMLElement, { text?: string }>("eo-button");

function MyComponent() {
  const [formValid, setFormValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const permissions = useCheckPermissions();

  // 使用 useMemo 优化复杂条件计算
  const shouldShowSubmit = useMemo(() => {
    return formValid && !loading && permissions.check("form:submit");
  }, [formValid, loading, permissions]);

  return <>{shouldShowSubmit && <WrappedEoButton text="提交" />}</>;
}
```

**关键点**:

- ✅ 使用 `useMemo` 优化复杂条件计算
- ✅ 正确声明依赖项数组

---

# 第五部分 (Context 转换) - 待续

## 5.1 Context 自由变量

### 5.1.1 基本用法

**Storyboard 配置**:

```yaml
context:
  - name: userName
    value: "张三"
  - name: userAge
    value: 25
  - name: formData
    value:
      name: ""
      email: ""
```

**React 转换**:

```tsx
function MyComponent() {
  // 字符串类型
  const [userName, setUserName] = useState("张三");

  // 数字类型
  const [userAge, setUserAge] = useState(25);

  // 对象类型
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  return (
    <div>
      <p>用户名: {userName}</p>
      <p>年龄: {userAge}</p>
    </div>
  );
}
```

**关键点**:

- ✅ `context.name` → React state 变量名
- ✅ `context.value` → `useState` 初始值
- ✅ 根据值类型添加 TypeScript 类型注解

### 5.1.2 动态初始值

**Storyboard 配置**:

```yaml
context:
  - name: userId
    value: "<% PATH.id %>"
  - name: keyword
    value: "<% QUERY.keyword || '' %>"
```

**React 转换**:

```tsx
import { useParams, useSearchParams } from "@next-core/react-runtime";

function MyComponent() {
  const { id } = usePathParams<{ id: string }>();
  const { keyword } = useParams();

  // 从路由参数初始化
  const [userId, setUserId] = useState(id);

  // 从查询参数初始化
  const [keyword, setKeyword] = useState(keyword || "");

  return <div>User ID: {userId}</div>;
}
```

**关键点**:

- ✅ 使用对应的 Hook 获取初始值
- ✅ 需要处理可能的 `null` 值

### 5.1.3 条件初始化

**Storyboard 配置**:

```yaml
context:
  - name: showAdvanced
    value: false
    if: "<% FLAGS.enableAdvanced %>"
```

**React 转换**:

```tsx
import { useFeatureFlags } from "@next-core/react-runtime";

function MyComponent() {
  const flags = useFeatureFlags();

  // 条件初始化: 只在特性开关启用时初始化
  const [showAdvanced, setShowAdvanced] = useState(
    flags.enableAdvanced ? false : undefined
  );

  return (
    <>
      {showAdvanced !== undefined && (
        <div>高级选项: {showAdvanced ? "显示" : "隐藏"}</div>
      )}
    </>
  );
}
```

**关键点**:

- ✅ 条件不满足时可以初始化为 `undefined`
- ✅ 在渲染时检查是否已初始化

## 5.2 Context 异步 Resolve

### 5.2.1 基本用法

**Storyboard 配置**:

```yaml
context:
  - name: userData
    resolve:
      useProvider: my.get-user-data
      args: ["<% PATH.userId %>"]
```

**React 转换**:

```tsx
import { useProvider, useParams } from "@next-core/react-runtime";

function MyComponent() {
  const { userId } = usePathParams<{ userId: string }>();

  // 使用 useProvider 加载异步数据
  const {
      data: userData,
      loading,
      error,
    } = useProvider(
      "my.get-user-data",
      { args: [userId] } // 依赖数组: 当 userId 变化时自动重新加载
    ),
    [];

  if (loading) return <div>加载中...</div>;
  if (error) return <div>加载失败: {error.message}</div>;

  return <div>用户名: {userData?.name}</div>;
}
```

**关键点**:

- ✅ `context.resolve.useProvider` → `useProvider` Hook
- ✅ 第一个参数是 provider 名称
- ✅ 第二个参数是依赖数组 (相当于 Storyboard 中的 args)
- ✅ 返回 `{ data, loading, error }` 三个状态

### 5.2.2 懒加载 (lazy: true)

**Storyboard 配置**:

```yaml
context:
  - name: userList
    resolve:
      useProvider: my.get-user-list
      args: ["<% CTX.searchParams %>"]
      lazy: true
```

**React 转换**:

```tsx
import { useProvider } from "@next-core/react-runtime";

function MyComponent() {
  const [searchParams, setSearchParams] = useState({});

  // 懒加载: 第二个参数传 null,不自动加载
  const {
    data: userList,
    loading,
    error,
    query,
  } = useProvider(
    "my.get-user-list",
    null // null 表示不自动加载
  );

  // 手动触发加载
  const handleSearch = async () => {
    await query([searchParams]);
  };

  return (
    <div>
      <button onClick={handleSearch}>搜索</button>
      {loading && <div>加载中...</div>}
      {userList && <div>找到 {userList.length} 个用户</div>}
    </div>
  );
}
```

**关键点**:

- ✅ `lazy: true` → 第二个参数传 `null`
- ✅ 使用返回的 `query` 函数手动触发加载
- ✅ 等同于 Storyboard 的 `context.load` action

### 5.2.3 数据转换 (transform)

**Storyboard 配置**:

```yaml
context:
  - name: userNames
    resolve:
      useProvider: my.get-user-list
      args: []
      transform:
        value: "<% DATA.map(user => user.name) %>"
```

**React 转换**:

```tsx
import { useProvider } from "@next-core/react-runtime";
import { useMemo } from "react";

function MyComponent() {
  const {
    data: userNames,
    loading,
    error,
  } = useProvider(
    "my.get-user-list",
    {
      transform: (data: any, newData: any) => {
        return newData?.map((user: any) => user.name) || [];
      },
    },
    []
  );

  return <div>用户名列表: {userNames.join(", ")}</div>;
}
```

**关键点**:

- ✅ `transform` → `useMemo` 转换数据
- ✅ 依赖原始数据,自动重新计算
- ⚠️ 注意处理 `undefined` 情况

### 5.2.4 异步模式 (async: true)

**Storyboard 配置**:

```yaml
context:
  - name: pageConfig
    resolve:
      useProvider: my.get-page-config
      args: []
      async: true
```

**React 转换**:

```tsx
import { useProvider } from "@next-core/react-runtime";

function MyComponent() {
  // async: true 表示异步加载,不阻塞渲染
  // 在 React 中,useProvider 默认就是异步的
  const { data: pageConfig, loading } = useProvider("my.get-page-config", []);

  return (
    <div>
      {/* 页面继续渲染,配置加载完成后更新 */}
      {loading ? (
        <div>配置加载中...</div>
      ) : (
        <div>配置: {JSON.stringify(pageConfig)}</div>
      )}
    </div>
  );
}
```

**关键点**:

- ✅ React 中 `useProvider` 默认就是异步的
- ✅ 不会阻塞页面渲染
- ✅ 通过 `loading` 状态显示加载提示

## 5.3 Context Track(追踪)

### 5.3.1 基本用法

**Storyboard 配置**:

```yaml
context:
  # 源数据
  - name: firstName
    value: "张"
  - name: lastName
    value: "三"

  # 追踪依赖,自动计算
  - name: fullName
    value: "<% CTX.firstName + CTX.lastName %>"
    track: true
```

**React 转换**:

```tsx
import { useMemo } from "react";

function MyComponent() {
  const [firstName, setFirstName] = useState("张");
  const [lastName, setLastName] = useState("三");

  // 使用 useMemo 自动追踪依赖并重新计算
  const fullName = useMemo(() => {
    return firstName + lastName;
  }, [firstName, lastName]); // 依赖数组

  return (
    <div>
      <p>全名: {fullName}</p>
    </div>
  );
}
```

**关键点**:

- ✅ `track: true` → `useMemo` 自动追踪
- ✅ 依赖项列表必须完整
- ✅ 当依赖变化时自动重新计算

### 5.3.2 复杂追踪

**Storyboard 配置**:

```yaml
context:
  - name: items
    value: []
  - name: pricePerItem
    value: 100

  - name: totalPrice
    value: "<% CTX.items.length * CTX.pricePerItem %>"
    track: true
```

**React 转换**:

```tsx
import { useMemo } from "react";

function MyComponent() {
  const [items, setItems] = useState<any[]>([]);
  const [pricePerItem, setPricePerItem] = useState(100);

  // 追踪多个依赖
  const totalPrice = useMemo(() => {
    return items.length * pricePerItem;
  }, [items, pricePerItem]);

  return (
    <div>
      <p>总价: ¥{totalPrice}</p>
    </div>
  );
}
```

**关键点**:

- ✅ 可以追踪多个依赖
- ✅ 使用数组的 `.length` 等属性也会触发重新计算

### 5.3.3 Context 依赖链 - 异步数据追踪

**适用场景**: 一个 context resolve 依赖另一个 context 的值，需要在依赖变化时重新加载数据

**核心规则**: ⚠️ **`track: true` 声明在依赖者（使用方）身上，而不是被依赖者！**

- 被依赖的 context（如 `searchParams`）**不需要**声明 `track: true`
- 依赖者（如 `userList`）在**自己身上**声明 `track: true`，表示要追踪所依赖的 context 变化

**Storyboard 配置 - 有 track: true**:

```yaml
context:
  # 被依赖者: searchParams (不需要 track: true)
  - name: searchParams
    value:
      keyword: ""
      page: 1
    # ← 被依赖者不需要 track: true

  # 依赖者: userList (在这里声明 track: true)
  - name: userList
    resolve:
      useProvider: user-api.search-users
      args: ["<% CTX.searchParams %>"] # userList 依赖 searchParams
    track: true # ← 关键: 在依赖者身上声明，表示追踪 searchParams 变化
```

**React 转换 - 有依赖追踪**:

```tsx
import { useState } from "react";
import { useProvider } from "@next-core/react-runtime";

function MyComponent() {
  // 被依赖者: searchParams
  const [searchParams, setSearchParams] = useState({
    keyword: "",
    page: 1,
  });

  // 依赖者: userList 声明了 track: true
  // → React 中依赖数组包含 searchParams
  const { data: userList, loading } = useProvider(
    "user-api.search-users",
    {
      args: [searchParams],
    },
    [searchParams] // ← 因为 userList 有 track: true，所以追踪 searchParams
  );

  // 更新搜索条件
  const handleSearch = (keyword: string) => {
    setSearchParams((prev) => ({ ...prev, keyword, page: 1 }));
    // 不需要手动 query，依赖数组会自动触发重新加载
  };

  return (
    <div>
      <input
        value={searchParams.keyword}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {loading ? "加载中..." : JSON.stringify(userList)}
    </div>
  );
}
```

**Storyboard 配置 - 无 track: true**:

```yaml
context:
  # 被依赖者: searchParams
  - name: searchParams
    value:
      keyword: ""
      page: 1

  # 依赖者: userList (没有声明 track: true)
  - name: userList
    resolve:
      useProvider: user-api.search-users
      args: ["<% CTX.searchParams %>"] # 虽然依赖 searchParams
    # ← 没有 track: true，不追踪 searchParams 变化
```

**React 转换 - 无依赖追踪**:

```tsx
function MyComponent() {
  const [searchParams, setSearchParams] = useState({
    keyword: "",
    page: 1,
  });

  // userList 没有 track: true
  // → React 中依赖数组为空，不追踪变化
  const { data: userList, query } = useProvider(
    "user-api.search-users",
    {
      args: [searchParams], // 使用初始值
    },
    [] // ← 因为 userList 没有 track: true，依赖数组为空
  );

  // 需要手动调用 query 重新加载
  const handleSearch = (keyword: string) => {
    const newParams = { ...searchParams, keyword, page: 1 };
    setSearchParams(newParams);
    query([newParams]); // ← 手动触发重新加载
  };

  return <div>...</div>;
}
```

**对比总结**:

| 配置       | Storyboard                    | React 依赖数组   | 行为                             |
| ---------- | ----------------------------- | ---------------- | -------------------------------- |
| **有追踪** | `userList` 声明 `track: true` | `[searchParams]` | searchParams 变化时自动重新加载  |
| **无追踪** | `userList` 无 `track: true`   | `[]`             | 只在挂载时加载，需手动 `query()` |

**依赖数组的写法**:

| 写法                                        | 适用场景       | 说明                             |
| ------------------------------------------- | -------------- | -------------------------------- |
| `[searchParams]`                            | 依赖整个对象   | 推荐，简单清晰                   |
| `[searchParams.keyword, searchParams.page]` | 依赖部分字段   | 更精确控制，避免不必要的重新加载 |
| `[]`                                        | 无 track: true | 不追踪，需手动 query             |

**复杂示例 - 多级依赖链**:

**Storyboard 配置**:

```yaml
context:
  # 1. 组织 ID (被依赖者)
  - name: orgId
    value: 1

  # 2. 部门列表 (依赖 orgId，声明 track: true)
  - name: departments
    resolve:
      useProvider: org-api.list-departments
      args: ["<% CTX.orgId %>"]
    track: true # ← departments 追踪 orgId 变化

  # 3. 用户列表 (依赖 departments，声明 track: true)
  - name: users
    resolve:
      useProvider: user-api.list-users
      args: ["<% CTX.departments[0]?.id %>"]
    track: true # ← users 追踪 departments 变化
```

**React 转换**:

```tsx
function MyComponent() {
  const [orgId, setOrgId] = useState(1);

  // departments 声明了 track: true，追踪 orgId
  const { data: departments } = useProvider(
    "org-api.list-departments",
    { args: [orgId] },
    [orgId] // ← departments 追踪 orgId
  );

  // users 声明了 track: true，追踪 departments
  const firstDeptId = departments?.[0]?.id;
  const { data: users } = useProvider(
    "user-api.list-users",
    { args: [firstDeptId] },
    [firstDeptId] // ← users 追踪 departments 的派生值
  );

  return <div>...</div>;
}
```

**关键点**:

- ✅ **`track: true` 声明在依赖者（使用方）身上**
- ✅ 被依赖的 context 不需要声明 `track: true`
- ✅ 有 `track: true` → 依赖数组包含所依赖的值
- ✅ 无 `track: true` → 依赖数组为空 `[]`，需手动 `query()`
- ✅ 多级依赖链：每一级在自己身上声明 `track: true`
- ⚠️ 依赖数组中的值必须是稳定的，避免每次渲染都创建新对象

```tsx
function MyComponent() {
  const [orgId, setOrgId] = useState(1);

  // 第一层依赖: departments 依赖 orgId
  const { data: departments } = useProvider(
    "org-api.list-departments",
    { args: [orgId] },
    [orgId] // ← orgId 变化时重新加载
  );

  // 第二层依赖: users 依赖 departments
  const firstDeptId = departments?.[0]?.id;
  const { data: users } = useProvider(
    "user-api.list-users",
    { args: [firstDeptId] },
    [firstDeptId] // ← firstDeptId 变化时重新加载
  );

  return <div>...</div>;
}
```

**关键点**:

- ✅ **只有显式声明 `track: true` 才追踪依赖**
- ✅ 无 `track: true` 的 context，其他 context 即使依赖它也不会自动重新加载
- ✅ 依赖数组可以是整个对象或解构后的字段
- ✅ 多级依赖链：每一级都需要在依赖数组中声明上一级的值
- ⚠️ 依赖数组中的值必须是稳定的，避免每次渲染都创建新对象

## 5.4 Context onChange

### 5.4.1 基本用法

**Storyboard 配置**:

```yaml
context:
  - name: searchKeyword
    value: ""
    onChange:
      - action: console.log
        args: ["搜索关键词变化:", "<% EVENT.detail %>"]
```

**React 转换**:

```tsx
import { useEffect } from "react";

function MyComponent() {
  const [searchKeyword, setSearchKeyword] = useState("");

  // 监听数据变化
  useEffect(() => {
    console.log("搜索关键词变化:", searchKeyword);
  }, [searchKeyword]); // 依赖数组

  return (
    <input
      value={searchKeyword}
      onChange={(e) => setSearchKeyword(e.target.value)}
    />
  );
}
```

**关键点**:

- ✅ `onChange` → `useEffect`
- ✅ 依赖数组包含要监听的变量
- ✅ `EVENT.detail` 在 React 中就是变量本身

### 5.4.2 触发 Provider 调用

**Storyboard 配置**:

```yaml
context:
  - name: userId
    value: ""
    onChange:
      - useProvider: my.log-user-view
        args: ["<% CTX.userId %>"]
```

**React 转换**:

```tsx
import { useProvider } from "@next-core/react-runtime";
import { useEffect } from "react";

function MyComponent() {
  const [userId, setUserId] = useState("");

  // 用于记录日志的 provider
  const { query: logUserView } = useProvider("my.log-user-view", null);

  // 监听 userId 变化并记录日志
  useEffect(() => {
    if (userId) {
      logUserView([userId]);
    }
  }, [userId, logUserView]);

  return <div>User ID: {userId}</div>;
}
```

**关键点**:

- ✅ 懒加载 provider (第二个参数 `null`)
- ✅ 在 `useEffect` 中调用 `query` 函数
- ✅ 添加空值检查避免不必要的调用

### 5.4.3 更新其他状态

**Storyboard 配置**:

```yaml
context:
  - name: category
    value: ""
    onChange:
      - action: context.assign
        args:
          - keyword
          - "" # 分类变化时清空搜索关键词
```

**React 转换**:

```tsx
import { useEffect } from "react";

function MyComponent() {
  const [category, setCategory] = useState("");
  const [keyword, setKeyword] = useState("");

  // 监听分类变化,清空关键词
  useEffect(() => {
    setKeyword("");
  }, [category]);

  return (
    <div>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">全部</option>
        <option value="electronics">电子产品</option>
      </select>
      <input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
    </div>
  );
}
```

**关键点**:

- ✅ 在 `useEffect` 中更新其他状态
- ⚠️ 注意避免循环依赖导致无限渲染

## 5.5 模板 State (Template State)

模板 state 是定义在模板构件（template brick）中的局部状态，与路由级别的 context 不同。模板 state 支持两种模式：**受控模式**（可接受父组件 props）和**非受控模式**（纯内部状态）。

### 5.5.1 受控模式 (expose: true 或默认)

当模板 state 没有 `expose` 字段或 `expose: true` 时，使用 `useControlledState` hook，支持受控/非受控混合模式。

**Storyboard 配置**:

```yaml
# template.yaml
name: tpl-custom-form
state:
  - name: selectedTab
    value: "home"
    # expose: true 或无 expose 字段（默认）

bricks:
  - brick: eo-tabs
    properties:
      activeKey: "<% STATE.selectedTab %>"
    events:
      change:
        - action: state.update
          args: ["selectedTab", "<% EVENT.detail %>"]
```

**React 转换**:

```tsx
import { useControlledState } from "@next-core/react-runtime";
import { wrapBrick } from "@next-core/react-element";

const WrappedEoTabs = wrapBrick<any, { activeKey?: string }>("eo-tabs");

interface TplCustomFormProps {
  selectedTab?: string; // ← 可接受父组件传入
}

export function TplCustomForm({
  selectedTab: propSelectedTab,
}: TplCustomFormProps) {
  // 使用 useControlledState：props 变化时状态立即跟随
  const [selectedTab, setSelectedTab] = useControlledState(
    propSelectedTab, // props 值
    "home" // 默认值
  );

  return (
    <WrappedEoTabs
      activeKey={selectedTab}
      onChange={(e: CustomEvent) => setSelectedTab(e.detail)}
    />
  );
}
```

**使用示例**:

```tsx
// 受控模式：父组件控制状态
<TplCustomForm selectedTab={parentTab} />

// 非受控模式：组件自己管理状态
<TplCustomForm />
```

**关键点**:

- ✅ 默认或 `expose: true` → 使用 `useControlledState`
- ✅ props 传入时为受控模式，props 变化状态立即更新
- ✅ props 为 undefined 时为非受控模式，使用默认值
- ✅ 支持父组件和自身两种控制方式

### 5.5.2 非受控模式 (expose: false)

当模板 state 设置 `expose: false` 时，使用普通的 `useState`，完全不接受 props，是纯内部状态。

**Storyboard 配置**:

```yaml
name: tpl-oauth-form
state:
  - name: isLoading
    value: false
    expose: false # ← 不暴露给外部，纯内部状态

  - name: debugMode
    value: false
    expose: false

bricks:
  - brick: eo-button
    properties:
      loading: "<% STATE.isLoading %>"
    events:
      click:
        - action: state.update
          args: ["isLoading", true]
```

**React 转换**:

```tsx
import { useState } from "react";
import { wrapBrick } from "@next-core/react-element";

const WrappedEoButton = wrapBrick<any, { loading?: boolean }>("eo-button");

// ← 注意：props 中不包含 isLoading 和 debugMode
export function TplOAuthForm() {
  // expose: false → 使用普通 useState，不接受 props
  const [isLoading, setIsLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
  };

  return <WrappedEoButton loading={isLoading} onClick={handleClick} />;
}
```

**关键点**:

- ✅ `expose: false` → 使用普通 `useState`
- ✅ 完全不接受 props，纯组件内部状态
- ✅ 适用于组件内部的临时状态（loading、展开/收起等）

### 5.5.3 state.onChange - 状态变化监听

模板 state 支持 `onChange` 回调，在状态变化时自动触发操作。

**Storyboard 配置**:

```yaml
state:
  - name: notRender
    value: false
    onChange:
      - method: setNotRender
        targetRef: formRef
        args: ["<% STATE.notRender %>"]

      - if: "<% !STATE.notRender %>"
        method: reStartTimer
        targetRef: timerRef
```

**React 转换**:

```tsx
import { useEffect, useRef } from "react";
import { useControlledState } from "@next-core/react-runtime";

export function TplOAuthForm({
  notRender: propNotRender,
}: {
  notRender?: boolean;
}) {
  const [notRender, setNotRender] = useControlledState(propNotRender, false);
  const formRef = useRef<any>();
  const timerRef = useRef<any>();

  // onChange → useEffect 监听状态变化
  useEffect(() => {
    // 执行 onChange 中定义的操作
    formRef.current?.setNotRender(notRender);

    // if 条件判断
    if (!notRender) {
      timerRef.current?.reStartTimer();
    }
  }, [notRender]); // ← 依赖 notRender 状态

  return (
    <div>
      <FormComponent ref={formRef} />
      <TimerComponent ref={timerRef} />
    </div>
  );
}
```

**关键点**:

- ✅ `onChange` → `useEffect(() => { ... }, [stateVar])`
- ✅ onChange 中的操作按顺序转换为 useEffect 内的代码
- ✅ 支持条件判断（if）
- ✅ 通过 ref 调用其他构件的方法

### 5.5.4 state.update - 状态更新

模板 state 通过 `state.update` action 更新状态，支持单个更新和批量更新。

#### 单个状态更新

**Storyboard 配置**:

```yaml
events:
  click:
    - action: state.update
      args: ["authConfigData", "<% { ...STATE.authConfigData, newField: 1 } %>"]
```

**React 转换**:

```tsx
const [authConfigData, setAuthConfigData] = useControlledState(
  propAuthConfigData,
  {}
);

const handleClick = () => {
  setAuthConfigData({ ...authConfigData, newField: 1 });
};
```

#### 批量更新多个状态

**Storyboard 配置**:

```yaml
events:
  submit:
    - action: state.update
      batch: true # ← 批量更新标记
      args:
        - { name: "isAccessTokenDebug", value: false }
        - { name: "isAccessTokenDebugging", value: false }
```

**React 转换**:

```tsx
const [isAccessTokenDebug, setIsAccessTokenDebug] = useState(false);
const [isAccessTokenDebugging, setIsAccessTokenDebugging] = useState(false);

const handleSubmit = () => {
  // batch: true → 直接多次调用 setState
  // React 18+ 会自动批处理这些更新，只触发一次重新渲染
  setIsAccessTokenDebug(false);
  setIsAccessTokenDebugging(false);
};
```

**关键点**:

- ✅ 单个更新 → 直接调用对应的 `setState`
- ✅ 批量更新（`batch: true`）→ 直接多次调用 `setState`
- ✅ React 18+ 自动批处理（automatic batching），多个 setState 只触发一次渲染
- ⚠️ 在 React 17 及以下版本，事件处理器外的更新需要手动使用 `unstable_batchedUpdates`

### 5.5.5 state vs context 对比

| 特性               | state（模板状态）                                       | context（路由状态）                  |
| ------------------ | ------------------------------------------------------- | ------------------------------------ |
| **定义位置**       | 模板构件内部                                            | 路由配置顶层                         |
| **作用域**         | 局部于当前模板                                          | 全局于当前路由                       |
| **是否接受 props** | 默认接受（expose: true）<br>可选不接受（expose: false） | 不接受 props                         |
| **React 转换**     | `useControlledState` 或 `useState`                      | `useState`                           |
| **跨层级传递**     | 通过 props 传递                                         | 使用 React Context                   |
| **访问方式**       | `STATE.xxx`                                             | `CTX.xxx`                            |
| **更新方式**       | `state.update`                                          | `context.assign` / `context.replace` |

### 5.5.6 path 字段用途

`path` 字段可以用作状态的注释说明，在转换为 React 时作为代码注释。

**Storyboard 配置**:

```yaml
state:
  - name: authConfigData
    path: "用户认证配置数据"
    value: {}

  - name: isAccessTokenDebug
    path: "是否处于 Access Token 调试模式"
    value: false
```

**React 转换**:

```tsx
// 用户认证配置数据
const [authConfigData, setAuthConfigData] = useControlledState(
  propAuthConfigData,
  {}
);

// 是否处于 Access Token 调试模式
const [isAccessTokenDebug, setIsAccessTokenDebug] = useState(false);
```

**关键点**:

- ✅ `path` 字段 → React 注释
- ✅ 提供状态的语义说明，增强代码可读性

### 5.5.7 完整示例对比

**Storyboard 配置**:

```yaml
name: tpl-oauth2-config-form
state:
  - name: authConfigData
    path: "认证配置数据"
    value: "<% { authConfig: {} } %>"
    # expose: true (默认)

  - name: isAccessTokenDebug
    value: false
    expose: false

  - name: notRender
    value: false
    onChange:
      - method: setNotRender
        target: ".oAuthFormItem"
        args: ["<% STATE.notRender %>"]

bricks:
  - brick: forms.general-form
    ref: formRef
    events:
      validate.success:
        - action: state.update
          args:
            [
              "authConfigData",
              "<% { ...STATE.authConfigData, updated: true } %>",
            ]

        - action: state.update
          batch: true
          args:
            - { name: "isAccessTokenDebug", value: false }
            - { name: "notRender", value: true }
```

**React 转换**:

```tsx
import { useState, useEffect, useRef } from "react";
import { useControlledState } from "@next-core/react-runtime";
import { wrapBrick } from "@next-core/react-element";

const WrappedGeneralForm = wrapBrick<any>("forms.general-form");

interface TplOAuth2ConfigFormProps {
  authConfigData?: { authConfig?: Record<string, any> };
  notRender?: boolean;
}

export function TplOAuth2ConfigForm({
  authConfigData: propAuthConfigData,
  notRender: propNotRender,
}: TplOAuth2ConfigFormProps) {
  // 认证配置数据 (expose: true/默认)
  const [authConfigData, setAuthConfigData] = useControlledState(
    propAuthConfigData,
    { authConfig: {} }
  );

  // expose: false - 纯内部状态
  const [isAccessTokenDebug, setIsAccessTokenDebug] = useState(false);

  // notRender (expose: true/默认)
  const [notRender, setNotRender] = useControlledState(propNotRender, false);

  const formRef = useRef<any>();

  // notRender 的 onChange 监听
  useEffect(() => {
    const oAuthFormItems = document.querySelectorAll(".oAuthFormItem");
    oAuthFormItems.forEach((item: any) => {
      item.setNotRender?.(notRender);
    });
  }, [notRender]);

  const handleValidateSuccess = () => {
    // 单个状态更新
    setAuthConfigData({ ...authConfigData, updated: true });

    // 批量更新 (batch: true)
    // React 18+ 自动批处理，无需额外包裹
    setIsAccessTokenDebug(false);
    setNotRender(true);
  };

  return (
    <WrappedGeneralForm
      ref={formRef}
      onValidateSuccess={handleValidateSuccess}
    />
  );
}
```

**关键点**:

- ✅ 模板 state 默认使用 `useControlledState`，支持父组件控制
- ✅ `expose: false` 使用 `useState`，纯内部状态
- ✅ `onChange` 转换为 `useEffect` 监听
- ✅ `state.update` 单个更新直接调用 setState
- ✅ `state.update` 批量更新（`batch: true`）直接多次调用 setState，React 18+ 自动批处理
- ✅ `path` 字段作为注释提供语义说明

---

# 第六部分: 事件处理转换

## 6.1 内置 Action 事件

### 6.1.1 路由导航 (history.\*)

**Storyboard 配置**:

```yaml
brick: eo-button
properties:
  text: 查看详情
events:
  click:
    - action: history.push
      args: ["/detail/<% PATH.id %>"]
```

**React 转换**:

```tsx
import { useHistory, usePathParams } from "@next-core/react-runtime";

const WrappedEoButton = wrapBrick<HTMLElement, { text?: string }>("eo-button");

function MyComponent() {
  const history = useHistory();
  const { id } = usePathParams<{ id: string }>();

  const handleClick = () => {
    history.push(`/detail/${id}`);
  };

  return <WrappedEoButton text="查看详情" onClick={handleClick} />;
}
```

**其他路由 Actions**:

```tsx
// history.replace - 替换当前路由
history.replace("/new-path");

// history.goBack - 返回上一页
history.goBack();

// history.goForward - 前进下一页
history.goForward();

// history.reload - 重新加载当前页
history.reload();

// history.pushQuery - 更新查询参数
history.pushQuery({ keyword: "搜索词" });

// history.replaceQuery - 替换查询参数
history.replaceQuery({ page: "2" });
```

### 6.1.2 Context 操作 (context.\*)

**Storyboard 配置**:

```yaml
events:
  submit:
    - action: context.assign
      args:
        - formData
        - name: "<% EVENT.detail.name %>"
          email: "<% EVENT.detail.email %>"
```

**React 转换**:

```tsx
function MyComponent() {
  const [formData, setFormData] = useState({ name: "", email: "" });

  const handleSubmit = (event: CustomEvent) => {
    const detail = event.detail;
    // context.assign → 合并更新
    setFormData((prev) => ({
      ...prev,
      name: detail.name,
      email: detail.email,
    }));
  };

  return <FormBrick onSubmit={handleSubmit} />;
}
```

**其他 Context Actions**:

```tsx
// context.replace - 完全替换
setFormData({ name: "新值", email: "新值" });

// context.load - 懒加载数据 (需要配合 useProvider)
const { query } = useProvider("my-provider", {}, null);
await query([args]);

// context.refresh - 刷新数据 (需要配合 useProvider，并设置cache: false)
const { query } = useProvider(
  "my-provider",
  {
    cache: false, // 设置不缓存数据
  },
  null
);
await query([args]);

// context.set - 设置单个字段 (Storyboard 中较少使用)
setFormData((prev) => ({ ...prev, name: "新值" }));
```

### 6.1.3 消息提示 (message.\*)

**Storyboard 配置**:

```yaml
events:
  click:
    - action: message.success
      args: ["操作成功!"]
```

**React 转换**:

```tsx
import { useMessage } from "@next-core/react-runtime";

function MyComponent() {
  const message = useMessage();

  const handleClick = () => {
    message.success("操作成功!");
  };

  return <button onClick={handleClick}>点击我</button>;
}
```

**其他消息 Actions**:

```tsx
const message = useMessage();

message.error("操作失败!");
message.info("这是一条信息");
message.warn("这是一条警告");
```

### 6.1.4 存储操作 (localStorage/sessionStorage)

**Storyboard 配置**:

```yaml
events:
  click:
    - action: localStorage.setItem
      args: ["userPreference", "<% JSON.stringify(CTX.preference) %>"]
```

**React 转换**:

```tsx
function MyComponent() {
  const [preference, setPreference] = useState({});

  const handleClick = () => {
    localStorage.setItem("userPreference", JSON.stringify(preference));
  };

  return <button onClick={handleClick}>保存偏好</button>;
}
```

**其他存储 Actions**:

```tsx
// localStorage.removeItem - 移除本地存储
localStorage.removeItem("userPreference");

// sessionStorage.setItem - 会话存储
sessionStorage.setItem("tempData", "value");

// sessionStorage.removeItem - 移除会话存储
sessionStorage.removeItem("tempData");
```

### 6.1.5 其他内置 Actions

**Storyboard 配置**:

```yaml
events:
  click:
    # 刷新页面
    - action: location.reload

    # 打开新窗口
    - action: window.open
      args: ["https://example.com", "_blank"]

    # 控制台输出
    - action: console.log
      args: ["调试信息:", "<% CTX.data %>"]

    # 阻止默认行为
    - action: event.preventDefault

    # 阻止事件冒泡
    - action: event.stopPropagation
```

**React 转换**:

```tsx
function MyComponent() {
  const [data, setData] = useState({});

  const handleClick = (event: React.MouseEvent) => {
    // location.reload
    window.location.reload();

    // window.open
    window.open("https://example.com", "_blank");

    // console.log
    console.log("调试信息:", data);

    // event.preventDefault
    event.preventDefault();

    // event.stopPropagation
    event.stopPropagation();
  };

  return <button onClick={handleClick}>执行操作</button>;
}
```

## 6.2 useProvider 事件

### 6.2.1 基本用法

**Storyboard 配置**:

```yaml
brick: eo-button
properties:
  text: 保存
events:
  click:
    - useProvider: my.save-user
      args: ["<% CTX.userData %>"]
```

**React 转换**:

```tsx
import { useProvider, useMessage } from "@next-core/react-runtime";
import { useState } from "react";

const WrappedEoButton = wrapBrick<HTMLElement, { text?: string }>("eo-button");

function MyComponent() {
  const [userData, setUserData] = useState({});
  const message = useMessage();

  // 懒加载模式
  const { query: saveUser, loading } = useProvider("my.save-user", null);

  const handleClick = async () => {
    try {
      await saveUser([userData]);
      message.success("保存成功");
    } catch (error) {
      message.error("保存失败");
    }
  };

  return (
    <WrappedEoButton text="保存" onClick={handleClick} disabled={loading} />
  );
}
```

**关键点**:

- ✅ useProvider 第二个参数传 `null` 表示懒加载
- ✅ 使用返回的 `query` 函数手动触发
- ✅ `query` 返回 Promise,可以使用 `async/await`

### 6.2.2 带回调的 Provider 调用

**Storyboard 配置**:

```yaml
events:
  submit:
    - useProvider: my.save-user
      args:
        - HOST
        - <% CTX.formData %>
      callback:
        success:
          - action: message.success
            args: ["保存成功"]
          - action: history.push
            args: ["/users"]
        error:
          - action: message.error
            args: ["保存失败: <% EVENT.detail.message %>"]
        finally:
          - action: context.assign
            args: [loading, false]
```

**React 转换**:

```tsx
import { useProvider, useHistory, useMessage } from "@next-core/react-runtime";

function MyComponent() {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const message = useMessage();
  const { query: saveUser } = useProvider("my.save-user", null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // success 回调
      await saveUser(["HOST", formData]);
      message.success("保存成功");
      history.push("/users");
    } catch (error: any) {
      // error 回调
      message.error(`保存失败: ${error.message}`);
    } finally {
      // finally 回调
      setLoading(false);
    }
  };

  return <button onClick={handleSubmit}>提交</button>;
}
```

**关键点**:

- ✅ `callback.success` → `try` 块
- ✅ `callback.error` → `catch` 块
- ✅ `callback.finally` → `finally` 块
- ✅ `EVENT.detail` 在错误回调中对应 `error` 对象

### 6.2.3 轮询 (poll)

**Storyboard 配置**:

```yaml
events:
  click:
    - useProvider: my.check-task-status
      args: ["<% CTX.taskId %>"]
      poll:
        enabled: true
        interval: 3000
        expectPollEnd: "<% DATA.status === 'completed' %>"
      callback:
        progress:
          - action: context.assign
            args: [taskStatus, "<% EVENT.detail.status %>"]
        success:
          - action: message.success
            args: ["任务完成!"]
```

**React 转换**:

```tsx
import { useProvider, useMessage } from "@next-core/react-runtime";
import { useEffect, useRef, useState } from "react";

function MyComponent() {
  const [taskId, setTaskId] = useState("");
  const [taskStatus, setTaskStatus] = useState("");
  const message = useMessage();
  const { query: checkTaskStatus } = useProvider("my.check-task-status", null);
  const pollTimerRef = useRef<NodeJS.Timeout>();

  const startPolling = async () => {
    // 清除之前的定时器
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }

    // 开始轮询
    pollTimerRef.current = setInterval(async () => {
      try {
        const result = await checkTaskStatus([taskId]);

        // progress 回调
        setTaskStatus(result.status);

        // expectPollEnd - 检查是否结束轮询
        if (result.status === "completed") {
          clearInterval(pollTimerRef.current!);

          // success 回调
          message.success("任务完成!");
        }
      } catch (error) {
        clearInterval(pollTimerRef.current!);
        message.error("轮询失败");
      }
    }, 3000); // interval
  };

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  return <button onClick={startPolling}>开始轮询</button>;
}
```

**关键点**:

- ✅ 使用 `setInterval` 实现轮询
- ✅ `poll.interval` → `setInterval` 的时间间隔
- ✅ `poll.expectPollEnd` → 条件判断后 `clearInterval`
- ✅ `callback.progress` → 每次轮询结果处理
- ✅ 组件卸载时清除定时器

### 6.2.4 handleHttpError - 统一错误处理

`handleHttpError` 是框架提供的统一错误处理函数，用于处理 HTTP 请求错误。它会自动处理认证失败（401）并重定向到登录页，对于其他错误则弹出错误提示对话框。

#### 场景一：useProvider 中的错误处理

**Storyboard 配置**:

```yaml
# 方式1: 在 useProvider 的 onReject 中调用
events:
  click:
    - useProvider: user-api.save-user
      args: ["<% CTX.userData %>"]
      onReject:
        - action: handleHttpError

# 方式2: 在 callback.error 中调用
events:
  submit:
    - useProvider: user-api.update-user
      args: ["<% CTX.userId %>", "<% EVENT.detail %>"]
      callback:
        success:
          - action: message.success
            args: ["更新成功"]
        error:
          - action: handleHttpError
```

**React 转换**:

无论是 `onReject` 还是 `callback.error` 中的 `handleHttpError`，都统一转换为 `useProvider` 的 `onError` 参数：

```tsx
import { useProvider, useMessage } from "@next-core/react-runtime";
import { handleHttpError } from "@next-core/runtime";
import { useState } from "react";

const WrappedEoButton = wrapBrick<HTMLElement, { text?: string }>("eo-button");

function MyComponent() {
  const [userData, setUserData] = useState({});
  const message = useMessage();

  // 方式1: 直接在 useProvider 中使用 onError
  const { query: saveUser, loading } = useProvider("user-api.save-user", {
    onError: (error) => handleHttpError(error),
  });

  const handleClick = async () => {
    await saveUser([userData]);
  };

  // 方式2: 也可以使用 useProvider 返回的 query 在 try-catch 中处理
  const { query: updateUser } = useProvider("user-api.update-user", null);

  const handleSubmit = async () => {
    try {
      await updateUser([userData.id, userData]);
      message.success("更新成功");
    } catch (error) {
      handleHttpError(error); // 在 catch 中调用
    }
  };

  return (
    <>
      <WrappedEoButton text="保存" onClick={handleClick} disabled={loading} />
      <WrappedEoButton text="更新" onClick={handleSubmit} />
    </>
  );
}
```

#### 场景二：非 useProvider 场景的错误处理

在非 useProvider 场景（如直接使用 fetch、axios 或其他异步操作），可以直接导入 `handleHttpError` 使用：

**Storyboard 配置**:

```yaml
events:
  click:
    - action: script.dispatchEvent
      callback:
        error:
          - action: handleHttpError
```

**React 转换**:

```tsx
import { handleHttpError } from "@next-core/runtime";

function MyComponent() {
  const handleCustomRequest = async () => {
    try {
      const response = await fetch("/api/custom-endpoint");
      if (!response.ok) {
        throw new Error("Request failed");
      }
      const data = await response.json();
      // 处理数据...
    } catch (error) {
      handleHttpError(error); // 直接导入使用
    }
  };

  return <button onClick={handleCustomRequest}>自定义请求</button>;
}
```

#### 场景三：Context resolve 中的错误处理

在 Context 的 resolve 中使用 `handleHttpError`：

**Storyboard 配置**:

```yaml
context:
  - name: userDetail
    resolve:
      useProvider: user-api.get-user-detail
      args: ["<% PATH.userId %>"]
      onReject:
        - action: handleHttpError
```

**React 转换**:

```tsx
import { useProvider, usePathParams } from "@next-core/react-runtime";
import { handleHttpError } from "@next-core/runtime";

function MyComponent() {
  const { userId } = usePathParams<{ userId: string }>();

  const { data: userDetail } = useProvider(
    "user-api.get-user-detail",
    {
      args: [userId],
      onError: (error) => handleHttpError(error),
    },
    [userId]
  );

  return <div>{userDetail?.name}</div>;
}
```

**关键点**:

- ✅ useProvider 中的 `onReject` 或 `callback.error` 中的 `handleHttpError` → 统一转换为 `onError` 参数
- ✅ 非 useProvider 场景 → 直接 `import { handleHttpError } from "@next-core/runtime"` 使用
- ✅ `handleHttpError` 会自动处理 401 错误并重定向到登录页
- ✅ 其他错误会弹出错误提示对话框
- ⚠️ `handleHttpError` 已经包含了 UI 反馈（对话框），通常不需要额外的 `message.error`

## 6.3 自定义构件方法调用

### 6.3.1 基本用法

**Storyboard 配置**:

```yaml
bricks:
  - brick: eo-table
    ref: myTable

  - brick: eo-button
    properties:
      text: 刷新表格
    events:
      click:
        - target: "#myTable" # 或 targetRef: "myTable"
          method: refresh
          args: []
```

**React 转换**:

```tsx
import { useRef } from "react";

// 假设 EoTable 有 refresh 方法
interface EoTableElement extends HTMLElement {
  refresh(): void;
}

const WrappedEoTable = wrapBrick<EoTableElement, any>("eo-table");
const WrappedEoButton = wrapBrick<HTMLElement, { text?: string }>("eo-button");

function MyComponent() {
  // 创建 ref
  const tableRef = useRef<EoTableElement>(null);

  const handleClick = () => {
    // 调用构件方法
    tableRef.current?.refresh();
  };

  return (
    <div>
      <WrappedEoTable ref={tableRef} />
      <WrappedEoButton text="刷新表格" onClick={handleClick} />
    </div>
  );
}
```

**关键点**:

- ✅ 使用 `useRef` 创建引用
- ✅ 通过 `ref.current?.method()` 调用方法
- ✅ 添加接口定义构件的方法类型

### 6.3.2 带参数的方法调用

**Storyboard 配置**:

```yaml
events:
  click:
    - targetRef: "myForm"
      method: setFieldsValue
      args:
        - name: "张三"
          age: 25
        - address: beijing
```

**React 转换**:

```tsx
interface FormElement extends HTMLElement {
  setFieldsValue(values: Record<string, any>): void;
}

const WrappedForm = wrapBrick<FormElement, any>("eo-form");

function MyComponent() {
  const formRef = useRef<FormElement>(null);

  const handleClick = () => {
    formRef.current?.setFieldsValue(
      {
        name: "张三",
        age: 25,
      },
      { address: "beijing" }
    );
  };

  return (
    <div>
      <WrappedForm ref={formRef} />
      <button onClick={handleClick}>填充表单</button>
    </div>
  );
}
```

## 6.4 设置构件属性

### 6.4.1 基本用法

**Storyboard 配置**:

```yaml
bricks:
  - brick: eo-input
    ref: myInput

  - brick: eo-button
    properties:
      text: 清空输入
    events:
      click:
        - targetRef: "myInput"
          properties:
            value: ""
```

**React 转换**:

```tsx
function MyComponent() {
  const [inputValue, setInputValue] = useState("初始值");

  const handleClear = () => {
    setInputValue(""); // 通过 state 更新属性
  };

  return (
    <div>
      <EoInput value={inputValue} onChange={(e) => setInputValue(e.detail)} />
      <EoButton text="清空输入" onClick={handleClear} />
    </div>
  );
}
```

**关键点**:

- ✅ React 中通过 state + props 实现属性更新
- ✅ 不需要直接操作 DOM 元素属性

## 6.5 事件条件处理

### 6.5.1 if 条件

**Storyboard 配置**:

```yaml
events:
  click:
    - action: message.success
      args: ["可以删除"]
      if: "<% CTX.canDelete %>"
    - action: message.error
      args: ["没有删除权限"]
      if: "<% !CTX.canDelete %>"
```

**React 转换**:

```tsx
import { useMessage } from "@next-core/react-runtime";
import { useState } from "react";

function MyComponent() {
  const [canDelete, setCanDelete] = useState(false);
  const message = useMessage();

  const handleClick = () => {
    if (canDelete) {
      message.success("可以删除");
    } else {
      message.error("没有删除权限");
    }
  };

  return <button onClick={handleClick}>删除</button>;
}
```

### 6.5.2 then-else 条件

**Storyboard 配置**:

```yaml
events:
  click:
    - if: "<% CTX.isValid %>"
      then:
        - action: message.success
          args: ["验证通过"]
      else:
        - action: message.error
          args: ["验证失败"]
```

**React 转换**:

```tsx
import { useMessage } from "@next-core/react-runtime";
import { useState } from "react";

function MyComponent() {
  const [isValid, setIsValid] = useState(false);
  const message = useMessage();

  const handleClick = () => {
    if (isValid) {
      message.success("验证通过");
    } else {
      message.error("验证失败");
    }
  };

  return <button onClick={handleClick}>验证</button>;
}
```

    }

};

return <button onClick={handleClick}>验证</button>;
}

````

## 6.6 事件链和回调

### 6.6.1 顺序执行多个操作

**Storyboard 配置**:
```yaml
events:
  click:
    - action: context.assign
      args: [loading, true]
    - useProvider: my.save-data
      args: ["<% CTX.formData %>"]
    - action: context.assign
      args: [loading, false]
````

**React 转换**:

```tsx
function MyComponent() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const { query: saveData } = useProvider("my.save-data", null);

  const handleClick = async () => {
    setLoading(true);
    try {
      await saveData([formData]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      保存
    </button>
  );
}
```

**关键点**:

- ✅ Storyboard 的事件链按顺序执行
- ✅ React 中使用 `async/await` 确保顺序
- ✅ 使用 `try-finally` 确保状态正确清理

---

# 第七部分: 生命周期转换

## 7.1 onMount 生命周期

**Storyboard 配置**:

```yaml
brick: eo-data-view
lifeCycle:
  onMount:
    - action: context.assign
      args: [mounted, true]
    - useProvider: my.load-initial-data
      args: []
```

**React 转换**:

```tsx
import { useEffect } from "react";
import { useProvider } from "@next-core/react-runtime";

function MyComponent() {
  const [mounted, setMounted] = useState(false);
  const { query: loadInitialData } = useProvider("my.load-initial-data", null);

  useEffect(() => {
    // onMount 执行一次
    setMounted(true);
    loadInitialData([]);
  }, []); // 空依赖数组 = 仅在挂载时执行

  return <div>组件已挂载: {mounted ? "是" : "否"}</div>;
}
```

**关键点**:

- ✅ `lifeCycle.onMount` → `useEffect(() => { ... }, [])`
- ✅ 空依赖数组确保只执行一次
- ✅ 可以执行多个操作

## 7.2 onUnmount 生命周期

**Storyboard 配置**:

```yaml
brick: eo-data-view
lifeCycle:
  onUnmount:
    - action: console.log
      args: ["组件卸载"]
    - action: localStorage.removeItem
      args: ["tempData"]
```

**React 转换**:

```tsx
import { useEffect } from "react";

function MyComponent() {
  useEffect(() => {
    // onMount 可以为空

    // onUnmount 在 return 函数中执行
    return () => {
      console.log("组件卸载");
      localStorage.removeItem("tempData");
    };
  }, []); // 空依赖数组

  return <div>组件内容</div>;
}
```

**关键点**:

- ✅ `lifeCycle.onUnmount` → `useEffect` 的 return 函数
- ✅ 用于清理副作用(定时器、订阅等)

## 7.3 页面生命周期

### 7.3.1 onPageLoad

**Storyboard 配置**:

```yaml
brick: eo-data-view
lifeCycle:
  onPageLoad:
    - action: console.log
      args: ["页面加载完成"]
```

**React 转换**:

```tsx
import { useEffect } from "react";

function MyComponent() {
  useEffect(() => {
    // onPageLoad - 页面渲染完成后执行
    console.log("页面加载完成");
  }, []);

  return <div>页面内容</div>;
}
```

### 7.3.2 onBeforePageLoad

**Storyboard 配置**:

```yaml
brick: eo-data-view
lifeCycle:
  onBeforePageLoad:
    - action: console.log
      args: ["页面即将加载"]
```

**React 转换**:

```tsx
import { useMemo } from "react";

function MyComponent() {
  // onBeforePageLoad - 在组件渲染前执行
  // 可以在组件顶部或 useMemo 中执行
  useMemo(() => {
    console.log("页面即将加载");
  }, []);

  return <div>页面内容</div>;
}
```

### 7.3.3 onAnchorLoad/onAnchorUnload

**Storyboard 配置**:

```yaml
brick: eo-data-view
lifeCycle:
  onAnchorLoad:
    - action: console.log
      args: ["URL hash 存在: <% ANCHOR %>"]
  onAnchorUnload:
    - action: console.log
      args: ["URL hash 为空"]
```

**React 转换**:

```tsx
import { useEffect } from "react";
import { useLocation } from "@next-core/react-runtime";

function MyComponent() {
  const location = useLocation();
  const anchor = location.hash.slice(1); // 移除 # 前缀

  useEffect(() => {
    if (anchor) {
      // onAnchorLoad
      console.log("URL hash 存在:", anchor);
    } else {
      // onAnchorUnload
      console.log("URL hash 为空");
    }
  }, [anchor]); // 监听 anchor 变化

  return <div>当前 anchor: {anchor || "无"}</div>;
}
```

### 7.3.4 lifeCycle.useResolves - 构件生命周期数据加载

**适用场景**: 在构件挂载时自动加载数据，并将转换后的数据作为构件的属性

**Storyboard 配置**:

```yaml
brick: eo-table
lifeCycle:
  useResolves:
    - useProvider: user-api.list-users
      args:
        - page: 1
          pageSize: 20
      transform:
        dataSource: "<% { list: DATA.list, total: DATA.total } %>"
        columns: "<% DATA.columns %>"
    - useProvider: user-api.get-summary
      transform:
        summary: "<% DATA %>"
```

**React 转换**:

```tsx
import { useProvider } from "@next-core/react-runtime";
import { wrapBrick } from "@next-core/react-element";

const WrappedEoTable = wrapBrick<
  HTMLElement,
  {
    dataSource?: { list: any[]; total: number };
    columns?: any[];
    summary?: any;
  }
>("eo-table");

function MyComponent() {
  // useResolves 项 1: 加载用户列表
  const { data: tableData } = useProvider(
    "user-api.list-users",
    {
      args: [{ page: 1, pageSize: 20 }],
      // transform 对象 → 返回对象，字段对应 brick properties
      transform: (_, newData) => ({
        dataSource: {
          list: newData.list,
          total: newData.total,
        },
        columns: newData.columns,
      }),
    },
    [] // 空数组 → 组件挂载时加载
  );

  // useResolves 项 2: 加载摘要数据
  const { data: summaryData } = useProvider(
    "user-api.get-summary",
    {
      transform: (_, newData) => ({
        summary: newData,
      }),
    },
    []
  );

  // 合并所有 transform 的结果作为 props
  return (
    <WrappedEoTable
      dataSource={tableData?.dataSource}
      columns={tableData?.columns}
      summary={summaryData?.summary}
    />
  );
}
```

**转换规则说明**:

1. **useResolves 数组 → 多个 useProvider 调用**
   - Storyboard: `useResolves: [provider1, provider2]`
   - React: 分别调用 `useProvider(provider1, ...)` 和 `useProvider(provider2, ...)`

2. **transform 对象 → 构件 properties**
   - Storyboard `transform` 中定义的每个字段对应 brick 的一个 property
   - React 中 transform 返回对象，字段作为组件的 props

3. **依赖数组使用空数组**
   - lifeCycle.useResolves 在组件挂载时执行
   - React: `useProvider(..., [], [])`

**复杂示例：错误处理 + 数据转换**

**Storyboard 配置**:

```yaml
brick: eo-search-table
lifeCycle:
  useResolves:
    - useProvider: user-api.search-users
      args: ["<% QUERY.keyword %>", "<% QUERY.page %>"]
      transform:
        dataSource: "<% DATA.list.map(item => ({ ...item, key: item.id })) %>"
        total: "<% DATA.total %>"
      onReject:
        - action: handleHttpError
```

**React 转换**:

```tsx
import { useProvider, useSearchParams } from "@next-core/react-runtime";
import { handleHttpError } from "@next-core/runtime";

function MyComponent() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") || "";
  const page = Number(searchParams.get("page")) || 1;

  const { data: searchData } = useProvider(
    "user-api.search-users",
    {
      args: [keyword, page],
      transform: (_, newData) => ({
        dataSource: newData.list.map((item) => ({ ...item, key: item.id })),
        total: newData.total,
      }),
      onError: (error) => handleHttpError(error), // onReject → onError
    },
    [keyword, page] // 依赖查询参数，参数变化时重新加载
  );

  return (
    <WrappedEoSearchTable
      dataSource={searchData?.dataSource}
      total={searchData?.total}
    />
  );
}
```

**关键点**:

- ✅ useResolves 数组中有多少项，就调用多少次 useProvider
- ✅ transform 返回的对象字段名 = 构件的 property 名 = React 组件的 prop 名
- ✅ 如果 transform 依赖动态值（如 QUERY），需要在依赖数组中声明
- ✅ onReject → onError 参数，可以使用 handleHttpError 处理错误
- ⚠️ 多个 useResolves 项返回的数据需要手动合并传递给组件

## 7.4 onScrollIntoView

**Storyboard 配置**:

```yaml
brick: eo-lazy-image
lifeCycle:
  onScrollIntoView:
    threshold: 0.5
    handlers:
      - action: console.log
        args: ["图片进入视图"]
```

**React 转换**:

```tsx
import { useEffect, useRef } from "react";

function MyComponent() {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // 使用 Intersection Observer API
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log("图片进入视图");
          }
        });
      },
      { threshold: 0.5 } // 阈值
    );

    observer.observe(element);

    // 清理函数
    return () => {
      observer.disconnect();
    };
  }, []);

  return <div ref={elementRef}>懒加载内容</div>;
}
```

**关键点**:

- ✅ 使用 `IntersectionObserver` API
- ✅ `threshold` 参数控制触发时机
- ✅ 记得在卸载时 `disconnect`

---

# 第五部分: 完整示例对比

## 示例 1: 简单表单页面

### Storyboard 配置

```yaml
context:
  - name: formData
    value:
      name: ""
      email: ""
  - name: loading
    value: false

bricks:
  - brick: eo-form
    properties:
      layout: vertical
    events:
      submit:
        - action: context.assign
          args: [loading, true]
        - useProvider: my.save-user
          args: ["<% CTX.formData %>"]
          callback:
            success:
              - action: message.success
                args: ["保存成功"]
              - action: history.push
                args: ["/users"]
            error:
              - action: message.error
                args: ["保存失败"]
            finally:
              - action: context.assign
                args: [loading, false]
    slots:
      "":
        type: bricks
        bricks:
          - brick: eo-input
            properties:
              name: name
              label: 姓名
              value: "<% CTX.formData.name %>"
            events:
              change:
                - action: context.assign
                  args:
                    - formData
                    - name: "<% EVENT.detail %>"

          - brick: eo-input
            properties:
              name: email
              label: 邮箱
              value: "<% CTX.formData.email %>"
            events:
              change:
                - action: context.assign
                  args:
                    - formData
                    - email: "<% EVENT.detail %>"

          - brick: eo-button
            properties:
              type: primary
              text: 提交
              loading: "<% CTX.loading %>"
```

### React 转换

```tsx
import React, { useState } from "react";
import { wrapBrick } from "@next-core/react-element";
import { useProvider, useHistory, useMessage } from "@next-core/react-runtime";

// 包装构件 (注意命名: Wrapped{组件名})
const WrappedEoForm = wrapBrick<HTMLElement, { layout?: string }>("eo-form");
const WrappedEoInput = wrapBrick<
  HTMLElement,
  {
    name?: string;
    label?: string;
    value?: string;
    onChange?: (e: CustomEvent) => void;
  }
>("eo-input");
const WrappedEoButton = wrapBrick<
  HTMLElement,
  {
    type?: string;
    text?: string;
    loading?: boolean;
  }
>("eo-button");

// 类型定义
interface FormData {
  name: string;
  email: string;
}

export function UserFormPage() {
  // Context → State
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);

  // Hooks
  const history = useHistory();
  const message = useMessage();
  const { query: saveUser } = useProvider("my.save-user", null);

  // 表单提交处理
  const handleSubmit = async (event: CustomEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await saveUser([formData]);
      message.success("保存成功");
      history.push("/users");
    } catch (error) {
      message.error("保存失败");
    } finally {
      setLoading(false);
    }
  };

  // 输入变化处理
  const handleNameChange = (event: CustomEvent) => {
    setFormData((prev) => ({ ...prev, name: event.detail }));
  };

  const handleEmailChange = (event: CustomEvent) => {
    setFormData((prev) => ({ ...prev, email: event.detail }));
  };

  return (
    <WrappedEoForm layout="vertical" onSubmit={handleSubmit}>
      <WrappedEoInput
        name="name"
        label="姓名"
        value={formData.name}
        onChange={handleNameChange}
      />
      <WrappedEoInput
        name="email"
        label="邮箱"
        value={formData.email}
        onChange={handleEmailChange}
      />
      <WrappedEoButton type="primary" text="提交" loading={loading} />
    </WrappedEoForm>
  );
}
```

## 示例 2: 列表页面(搜索+分页)

### Storyboard 配置

```yaml
context:
  - name: searchParams
    value:
      keyword: ""
      page: 1
      pageSize: 20

  - name: userList
    resolve:
      useProvider: my.search-users
      args: ["<% CTX.searchParams %>"]
      lazy: false
    track: true

bricks:
  - brick: eo-search-bar
    properties:
      placeholder: 请输入关键词搜索
    events:
      search:
        - action: context.assign
          args:
            - searchParams
            - keyword: "<% EVENT.detail %>"
              page: 1

  - brick: eo-table
    properties:
      data: "<% CTX.userList.list %>"
      total: "<% CTX.userList.total %>"
      page: "<% CTX.searchParams.page %>"
      pageSize: "<% CTX.searchParams.pageSize %>"
    events:
      pageChange:
        - action: context.assign
          args:
            - searchParams
            - page: "<% EVENT.detail %>"

  - brick: eo-button
    properties:
      text: 新建用户
    events:
      click:
        - action: history.push
          args: ["/users/new"]
```

### React 转换

```tsx
import React, { useState, useEffect } from "react";
import { wrapBrick } from "@next-core/react-element";
import { useProvider, useHistory } from "@next-core/react-runtime";

// 包装构件 (注意命名: Wrapped{组件名})
const WrappedEoSearchBar = wrapBrick<
  HTMLElement,
  {
    placeholder?: string;
    onSearch?: (e: CustomEvent) => void;
  }
>("eo-search-bar");

const WrappedEoTable = wrapBrick<
  HTMLElement,
  {
    data?: any[];
    total?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (e: CustomEvent) => void;
  }
>("eo-table");

const WrappedEoButton = wrapBrick<
  HTMLElement,
  {
    text?: string;
    onClick?: () => void;
  }
>("eo-button");

// 类型定义
interface SearchParams {
  keyword: string;
  page: number;
  pageSize: number;
}

interface UserListResponse {
  list: any[];
  total: number;
}

export function UserListPage() {
  // Context → State
  const [searchParams, setSearchParams] = useState<SearchParams>({
    keyword: "",
    page: 1,
    pageSize: 20,
  });

  // Context resolve + track → useProvider with dependencies
  const {
    data: userList,
    loading,
    error,
  } = useProvider<UserListResponse>(
    "my.search-users",
    [searchParams] // track: true → 依赖数组包含 searchParams
  );

  // Hooks
  const history = useHistory();

  // 搜索处理
  const handleSearch = (event: CustomEvent) => {
    setSearchParams((prev) => ({
      ...prev,
      keyword: event.detail,
      page: 1, // 重置页码
    }));
  };

  // 分页处理
  const handlePageChange = (event: CustomEvent) => {
    setSearchParams((prev) => ({
      ...prev,
      page: event.detail,
    }));
  };

  // 新建用户
  const handleCreate = () => {
    history.push("/users/new");
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>加载失败: {error.message}</div>;

  return (
    <div>
      <WrappedEoSearchBar
        placeholder="请输入关键词搜索"
        onSearch={handleSearch}
      />

      <WrappedEoTable
        data={userList?.list}
        total={userList?.total}
        page={searchParams.page}
        pageSize={searchParams.pageSize}
        onPageChange={handlePageChange}
      />

      <WrappedEoButton text="新建用户" onClick={handleCreate} />
    </div>
  );
}
```

## 示例 3: 主从详情页

### Storyboard 配置

```yaml
context:
  - name: userId
    value: "<% PATH.id %>"

  - name: userDetail
    resolve:
      useProvider: my.get-user-detail
      args: ["<% CTX.userId %>"]

  - name: isEditing
    value: false

bricks:
  - brick: eo-descriptions
    properties:
      title: 用户详情
      data: "<% CTX.userDetail %>"
    if: "<% !CTX.isEditing %>"

  - brick: eo-form
    properties:
      initialValues: "<% CTX.userDetail %>"
    if: "<% CTX.isEditing %>"
    events:
      submit:
        - useProvider: my.update-user
          args: ["<% CTX.userId %>", "<% EVENT.detail %>"]
          callback:
            success:
              - action: message.success
                args: ["更新成功"]
              - action: context.assign
                args: [isEditing, false]
              - action: context.refresh
                args: [userDetail]

  - brick: eo-button
    properties:
      text: "<% CTX.isEditing ? '取消' : '编辑' %>"
    events:
      click:
        - action: context.assign
          args: [isEditing, "<% !CTX.isEditing %>"]

  - brick: eo-button
    properties:
      text: 返回列表
    events:
      click:
        - action: history.push
          args: ["/users"]
```

### React 转换

```tsx
import React, { useState } from "react";
import { wrapBrick } from "@next-core/react-element";
import {
  useProvider,
  useHistory,
  useParams,
  useMessage,
} from "@next-core/react-runtime";

// 包装构件 (注意命名: Wrapped{组件名})
const WrappedEoDescriptions = wrapBrick<
  HTMLElement,
  {
    title?: string;
    data?: any;
  }
>("eo-descriptions");

const WrappedEoForm = wrapBrick<
  HTMLElement,
  {
    initialValues?: any;
    onSubmit?: (e: CustomEvent) => void;
  }
>("eo-form");

const WrappedEoButton = wrapBrick<
  HTMLElement,
  {
    text?: string;
    onClick?: () => void;
  }
>("eo-button");

export function UserDetailPage() {
  // 路由参数
  const { id: userId } = useParams<{ id: string }>();

  // 状态
  const [isEditing, setIsEditing] = useState(false);

  // 加载用户详情
  const {
    data: userDetail,
    loading,
    error,
    query: refreshUserDetail,
  } = useProvider("my.get-user-detail", [userId]);

  // 更新用户
  const { query: updateUser } = useProvider("my.update-user", null);

  // Hooks
  const history = useHistory();
  const message = useMessage();

  // 表单提交
  const handleSubmit = async (event: CustomEvent) => {
    try {
      await updateUser([userId, event.detail]);
      message.success("更新成功");
      setIsEditing(false);
      // 刷新数据
      await refreshUserDetail([userId]);
    } catch (error) {
      message.error("更新失败");
    }
  };

  // 切换编辑模式
  const handleToggleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  // 返回列表
  const handleBack = () => {
    history.push("/users");
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>加载失败: {error.message}</div>;

  return (
    <div>
      {/* 条件渲染 */}
      {!isEditing ? (
        <WrappedEoDescriptions title="用户详情" data={userDetail} />
      ) : (
        <WrappedEoForm initialValues={userDetail} onSubmit={handleSubmit} />
      )}

      <WrappedEoButton
        text={isEditing ? "取消" : "编辑"}
        onClick={handleToggleEdit}
      />

      <WrappedEoButton text="返回列表" onClick={handleBack} />
    </div>
  );
}
```

---

# 第八部分: 转换注意事项与最佳实践

## 8.1 何时使用不同的构件包装方式

### wrapBrick vs ReactUseBrick vs asyncWrapBrick

| 方式               | 适用场景                   | 性能                | 灵活性      |
| ------------------ | -------------------------- | ------------------- | ----------- |
| **wrapBrick** ✅   | 构件名称固定,属性大多固定  | ⭐⭐⭐ 最佳         | ⭐⭐ 中等   |
| **ReactUseBrick**  | 构件名称或大量属性动态变化 | ⭐ 较差             | ⭐⭐⭐ 最高 |
| **asyncWrapBrick** | 构件体积大,需要按需加载    | ⭐⭐ 良好(代码分割) | ⭐⭐ 中等   |

**推荐策略**:

1. ✅ 优先使用 `wrapBrick`
2. ⚠️ 仅在必要时使用 `ReactUseBrick`
3. 💡 大型构件考虑 `asyncWrapBrick`

## 8.2 性能优化

### 8.2.1 useMemo 优化计算

```tsx
// ❌ 不推荐: 每次渲染都重新计算
function MyComponent() {
  const expensiveValue = computeExpensiveValue(data);
  return <div>{expensiveValue}</div>;
}

// ✅ 推荐: 使用 useMemo
function MyComponent() {
  const expensiveValue = useMemo(
    () => computeExpensiveValue(data),
    [data] // 仅在 data 变化时重新计算
  );
  return <div>{expensiveValue}</div>;
}
```

### 8.2.2 useCallback 优化函数

```tsx
// ❌ 不推荐: 每次渲染创建新函数
function MyComponent() {
  const handleClick = () => {
    console.log("clicked");
  };
  return <ChildComponent onClick={handleClick} />;
}

// ✅ 推荐: 使用 useCallback
function MyComponent() {
  const handleClick = useCallback(() => {
    console.log("clicked");
  }, []); // 空依赖数组,函数永远不变

  return <ChildComponent onClick={handleClick} />;
}
```

### 8.2.3 正确声明依赖项

```tsx
// ❌ 不推荐: 依赖项不完整
useEffect(() => {
  fetchData(userId, keyword);
}, [userId]); // 缺少 keyword

// ✅ 推荐: 声明所有依赖项
useEffect(() => {
  fetchData(userId, keyword);
}, [userId, keyword]);
```

## 8.3 类型安全建议

### 8.3.1 为 Props 添加类型

```tsx
// ✅ 推荐: 定义完整的 Props 类型 (不包含事件处理器)
interface EoButtonProps {
  type?: "primary" | "default" | "dashed" | "link";
  text?: string;
  disabled?: boolean;
  loading?: boolean;
  // ❌ 不要在这里定义 onClick 等事件
}

const WrappedEoButton = wrapBrick<HTMLElement, EoButtonProps>("eo-button");

// 使用时事件直接传递
<WrappedEoButton
  type="primary"
  text="提交"
  onClick={(e) => console.log("clicked")} // 事件作为 HTML 属性
/>;
```

**关键点**:

- ✅ Props 接口只定义属性,不定义事件处理器
- ✅ 事件处理器通过 HTML 属性传递 (onClick, onChange 等)
- ✅ 如果需要自定义事件映射,参考 §4.1.2

### 8.3.2 为 State 添加类型

```tsx
// ❌ 不推荐: 类型推断可能不准确
const [formData, setFormData] = useState({});

// ✅ 推荐: 明确指定类型
interface FormData {
  name: string;
  email: string;
  age?: number;
}

const [formData, setFormData] = useState<FormData>({
  name: "",
  email: "",
});
```

### 8.3.3 为 useProvider 添加类型

```tsx
// ❌ 不推荐: 返回类型为 any
const { data } = useProvider("my-provider", []);

// ✅ 推荐: 指定返回类型
interface UserData {
  id: string;
  name: string;
  email: string;
}

const { data } = useProvider<UserData>("my-provider", []);
```

## 8.4 常见陷阱

### 8.4.1 忘记清理副作用

```tsx
// ❌ 不推荐: 忘记清理定时器
useEffect(() => {
  const timer = setInterval(() => {
    console.log("tick");
  }, 1000);
}, []);

// ✅ 推荐: 清理副作用
useEffect(() => {
  const timer = setInterval(() => {
    console.log("tick");
  }, 1000);

  return () => {
    clearInterval(timer);
  };
}, []);
```

### 8.4.2 状态更新后立即使用

```tsx
// ❌ 不推荐: setState 是异步的
const handleClick = () => {
  setCount(count + 1);
  console.log(count); // 打印的是旧值!
};

// ✅ 推荐: 使用 useEffect 监听变化
const handleClick = () => {
  setCount(count + 1);
};

useEffect(() => {
  console.log(count); // 打印的是新值
}, [count]);
```

### 8.4.3 过度使用 ReactUseBrick

```tsx
// ❌ 不推荐: 不必要地使用 ReactUseBrick
<ReactUseBrick
  useBrick={{
    brick: "eo-button",
    properties: { text: "点击" },
  }}
/>;

// ✅ 推荐: 使用 wrapBrick
const WrappedEoButton = wrapBrick("eo-button");
<WrappedEoButton text="点击" />;
```

## 8.5 代码组织建议

### 8.5.1 文件结构

```
src/
├── pages/                  # 页面组件
│   ├── UserListPage.tsx
│   ├── UserDetailPage.tsx
│   └── UserFormPage.tsx
├── components/             # 复用组件
│   ├── UserCard.tsx
│   └── UserFilter.tsx
├── hooks/                  # 自定义 Hooks
│   ├── useUserData.ts
│   └── useFormValidation.ts
├── bricks/                 # 包装的构件
│   ├── EoButton.tsx
│   ├── EoForm.tsx
│   └── index.ts
└── types/                  # 类型定义
    └── user.ts
```

### 8.5.2 提取自定义 Hook

```tsx
// ✅ 推荐: 提取可复用的逻辑
// hooks/useUserData.ts
export function useUserData(userId: string) {
  const { data, loading, error, query } = useProvider("my.get-user-detail", [
    userId,
  ]);

  const refresh = useCallback(() => {
    return query([userId]);
  }, [userId, query]);

  return { data, loading, error, refresh };
}

// 在组件中使用
function UserDetailPage() {
  const { id } = useParams();
  const { data: userDetail, loading, refresh } = useUserData(id);

  // ...
}
```

---

# 第九部分: 快速参考卡片

## 9.1 Storyboard → React 速查表

### 常见需求速查

| 需求                       | Storyboard 写法                                         | React 写法                                               |
| -------------------------- | ------------------------------------------------------- | -------------------------------------------------------- |
| **定义状态**               | `context: [{ name: x, value: 1 }]`                      | `const [x, setX] = useState(1);`                         |
| **异步加载**               | `context: [{ name: x, resolve: { useProvider: "p" } }]` | `const { data: x } = useProvider("p", []);`              |
| **使用构件**               | `brick: eo-button`                                      | `const WrappedEoButton = wrapBrick("eo-button");`        |
| **构件实例标签**           | `brick: eo-text, alias: 收货地址`                       | `{/* 收货地址 */}\n<WrappedEoText ... />`                |
| **标准事件**               | `events: { click: [...] }`                              | `onClick={(e) => ...}`                                   |
| **自定义事件**             | `events: { "visible.change": [...] }`                   | `onVisibleChange={(e) => ...}` (需要映射)                |
| **条件渲染**               | `brick: "x", if: "<% CTX.show %>"`                      | `{show && <X />}`                                        |
| **页面跳转**               | `action: "history.push", args: ["/page"]`               | `history.push("/page");`                                 |
| **显示提示**               | `action: "message.success", args: ["成功"]`             | `const message = useMessage(); message.success("成功");` |
| **更新状态**               | `action: "context.assign", args: [x, 1]`                | `setX(1);`                                               |
| **合并状态**               | `action: "context.assign", args: [obj, { a: 1 }]`       | `setObj(prev => ({ ...prev, a: 1 }));`                   |
| **获取路由参数**           | `<% PATH.id %>`                                         | `const { id } = useParams();`                            |
| **获取查询参数**           | `<% QUERY.keyword %>`                                   | `const keyword = useSearchParams().get("keyword");`      |
| **获取应用信息**           | `<% APP.homepage %>`                                    | `const app = useCurrentApp();`                           |
| **获取当前用户**           | `<% SYS.username %>`                                    | `const sys = useSystemInfo(); sys.username`              |
| **获取组织 ID**            | `<% SYS.org %>`                                         | `const sys = useSystemInfo(); sys.org`                   |
| **获取品牌设置**           | `<% SYS.settings.brand.xxx %>`                          | `const sys = useSystemInfo(); sys.settings.brand.xxx`    |
| **权限校验**               | `<% PERMISSIONS.check("action") %>`                     | `useCheckPermissions().check("action")`                  |
| **组件挂载**               | `lifeCycle: { onMount: [...] }`                         | `useEffect(() => { ... }, []);`                          |
| **组件卸载**               | `lifeCycle: { onUnmount: [...] }`                       | `useEffect(() => () => { ... }, []);`                    |
| **生命周期数据加载**       | `lifeCycle: { useResolves: [...] }`                     | `useProvider(..., {}, []);`                              |
| **依赖追踪 (track: true)** | `context: [{ name: x, track: true }]`                   | `useProvider(..., [dependency]);`                        |
| **错误处理**               | `callback: { error: [{ action: handleHttpError }] }`    | `useProvider(..., { onError: handleHttpError });`        |
| **模板 state (受控)**      | `state: [{ name: x, value: 1 }]`                        | `const [x, setX] = useControlledState(propX, 1);`        |
| **模板 state (非受控)**    | `state: [{ name: x, value: 1, expose: false }]`         | `const [x, setX] = useState(1);`                         |
| **访问模板状态**           | `<% STATE.xxx %>`                                       | `xxx` (直接使用变量)                                     |
| **更新模板状态**           | `action: "state.update", args: [x, 1]`                  | `setX(1);`                                               |
| **批量更新状态**           | `action: "state.update", batch: true, args: [...]`      | 多次 `setState()`（React 18+ 自动批处理）                |
| **状态变化监听**           | `state: [{ name: x, onChange: [...] }]`                 | `useEffect(() => { ... }, [x]);`                         |

### 事件名映射速查

| Storyboard 事件名       | React 处理器名          | 说明                |
| ----------------------- | ----------------------- | ------------------- |
| `click`                 | `onClick`               | 标准 HTML 事件      |
| `change`                | `onChange`              | 标准 HTML 事件      |
| `blur`                  | `onBlur`                | 标准 HTML 事件      |
| `focus`                 | `onFocus`               | 标准 HTML 事件      |
| `visible.change`        | `onVisibleChange`       | 自定义事件 (需映射) |
| `action.click`          | `onActionClick`         | 自定义事件 (需映射) |
| `item.drag.start`       | `onItemDragStart`       | 自定义事件 (需映射) |
| `before.visible.change` | `onBeforeVisibleChange` | 自定义事件 (需映射) |

**命名转换规则**:

```
Storyboard 事件名          →  React 处理器名
─────────────────────────    ─────────────────
click                    →  onClick
visible.change           →  onVisibleChange
item.drag.start          →  onItemDragStart

规则: on + 驼峰命名 (点号分隔 → 首字母大写)
```

## 9.2 常见模式代码片段

### 模式 1: 表单提交

```tsx
const [formData, setFormData] = useState({ name: "", email: "" });
const [loading, setLoading] = useState(false);
const message = useMessage();
const { query: submitForm } = useProvider("my.submit-form", null);
const history = useHistory();

const handleSubmit = async (event: CustomEvent) => {
  setLoading(true);
  try {
    await submitForm([formData]);
    message.success("提交成功");
    history.push("/success");
  } catch (error: any) {
    message.error(`提交失败: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
```

### 模式 2: 列表搜索

```tsx
const [searchParams, setSearchParams] = useState({ keyword: "", page: 1 });
const { data: list, loading } = useProvider("my.search", [searchParams]);

const handleSearch = (keyword: string) => {
  setSearchParams({ keyword, page: 1 });
};

const handlePageChange = (page: number) => {
  setSearchParams((prev) => ({ ...prev, page }));
};
```

### 模式 3: 主从联动

```tsx
const [selectedId, setSelectedId] = useState<string>();
const { data: detail } = useProvider(
  "my.get-detail",
  selectedId ? [selectedId] : null // 有选中项时才加载
);

const handleSelect = (id: string) => {
  setSelectedId(id);
};
```

### 模式 4: 权限控制

```tsx
const permissions = useCheckPermissions();
const canEdit = permissions.check("resource:edit");
const canDelete = permissions.check("resource:delete");

return (
  <>
    {canEdit && <EditButton />}
    {canDelete && <DeleteButton />}
  </>
);
```

### 模式 5: 轮询数据

```tsx
const [taskId, setTaskId] = useState("");
const [taskStatus, setTaskStatus] = useState("");
const message = useMessage();
const { query: checkStatus } = useProvider("my.check-status", null);
const timerRef = useRef<NodeJS.Timeout>();

const startPolling = () => {
  timerRef.current = setInterval(async () => {
    const result = await checkStatus([taskId]);
    setTaskStatus(result.status);

    if (result.status === "completed") {
      clearInterval(timerRef.current!);
      message.success("任务完成!");
    }
  }, 3000);
};

useEffect(() => {
  return () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
}, []);
```

---

# 第十部分: 附录

## 10.1 全局变量映射表

| Storyboard 全局对象           | React 获取方式                          | 说明                      |
| ----------------------------- | --------------------------------------- | ------------------------- |
| `CTX.xxx`                     | `xxx`                                   | Context 变量 → State 变量 |
| `APP.homepage`                | `useCurrentApp().homepage`              | 应用主页                  |
| `APP.id`                      | `useCurrentApp().id`                    | 应用 ID                   |
| `APP.name`                    | `useCurrentApp().name`                  | 应用名称                  |
| `PATH.id`                     | `useParams().id`                        | 路由参数                  |
| `PATH.userId`                 | `useParams().userId`                    | 路由参数                  |
| `QUERY.keyword`               | `useSearchParams().get("keyword")`      | 查询参数                  |
| `QUERY.page`                  | `useSearchParams().get("page")`         | 查询参数                  |
| `EVENT.detail`                | 事件处理函数参数 `event.detail`         | 事件数据                  |
| `EVENT.type`                  | 事件处理函数参数 `event.type`           | 事件类型                  |
| `PERMISSIONS.check("action")` | `useCheckPermissions().check("action")` | 权限校验                  |
| `FLAGS.myFlag`                | `useFeatureFlags().myFlag`              | 特性开关                  |
| `SYS.username`                | `useAuth().username`                    | 当前用户名                |
| `SYS.userInstanceId`          | `useAuth().userInstanceId`              | 用户实例 ID               |
| `LOCATION.href`               | `useLocation().pathname`                | 当前路径                  |
| `ANCHOR`                      | `useLocation().hash.slice(1)`           | URL hash (移除#)          |
| `THEME`                       | `useCurrentTheme()`                     | 当前主题                  |

## 10.2 术语对照表

| Storyboard 术语 | React 术语    | 说明            |
| --------------- | ------------- | --------------- |
| Context         | State         | 状态数据        |
| Brick           | Component     | 组件/构件       |
| Alias           | Comment       | 构件别名 → 注释 |
| Provider        | API 调用      | 数据提供者      |
| Event Handler   | Event Handler | 事件处理器      |
| LifeCycle       | Effect        | 生命周期        |
| Slot            | Children      | 插槽/子元素     |
| Property        | Prop          | 属性            |
| Resolve         | Async Data    | 异步数据        |
| Track           | Computed      | 计算属性        |
| Template        | Expression    | 模板表达式      |

## 10.3 构件包名称映射表

**说明**: Storyboard 中可能使用包名格式引用构件（如 `basic.general-text`），而 React 中应使用实际的构件标签名（如 `eo-text`）。以下是常见的包名到构件名的映射。

| Storyboard brick 字段值            | React wrapBrick 参数 | 说明         |
| ---------------------------------- | -------------------- | ------------ |
| `basic.general-text`               | `"eo-text"`          | 通用文本构件 |
| `basic.general-button`             | `"eo-button"`        | 通用按钮构件 |
| `basic.general-card`               | `"eo-card"`          | 卡片容器构件 |
| `basic.general-modal`              | `"eo-modal"`         | 模态框构件   |
| `basic.general-drawer`             | `"eo-drawer"`        | 抽屉构件     |
| `presentational-bricks.brick-link` | `"eo-link"`          | 链接构件     |
| `presentational-bricks.brick-tag`  | `"eo-tag"`           | 标签构件     |
| `forms.general-form`               | `"eo-form"`          | 表单构件     |
| `forms.general-input`              | `"eo-input"`         | 输入框构件   |
| `forms.general-select`             | `"eo-select"`        | 下拉选择构件 |

**识别规则**:

```
Storyboard brick 字段值格式判断：

1. 包含 "basic."
   → 是 basic 包的构件引用
   → 转换规则: basic.general-[name] → eo-[name]
   → 例: basic.general-text → wrapBrick("eo-text")

2. 包含 "presentational-bricks."
   → 是 presentational-bricks 包的构件引用
   → 转换规则: presentational-bricks.brick-[name] → eo-[name]
   → 例: presentational-bricks.brick-link → wrapBrick("eo-link")

3. 包含 "forms."
   → 是 forms 包的构件引用
   → 转换规则: forms.general-[name] → eo-[name]
   → 例: forms.general-input → wrapBrick("eo-input")

4. 以 "eo-" 开头
   → 直接是实际构件标签名
   → 直接使用: wrapBrick("eo-xxx")

5. 其他包含点号的名称
   → 可能是自定义包的构件引用
   → 需要查询构件定义或提示用户
```

**转换示例**:

```yaml
# Storyboard (使用包名格式)
brick: basic.general-text
properties:
  textContent: Hello
```

```tsx
// React (转换为实际构件名)
const WrappedEoText = wrapBrick<HTMLElement, EoTextProps>("eo-text");

<WrappedEoText textContent="Hello" />;
```

**注意**: 不要将此与 Storyboard 的 `alias` 字段混淆。`alias` 字段是对构件实例的标签说明，应转换为 JSX 注释（参见 §4.1.5）。

## 10.4 疑难问题解答

### Q1: 如何处理 Storyboard 中的模板表达式?

**A**: 移除 `<% %>` 标记,直接使用 JavaScript 表达式:

```tsx
// Storyboard: "<% CTX.count > 0 ? '有数据' : '无数据' %>"
// React:
const text = count > 0 ? "有数据" : "无数据";
```

### Q2: 如何实现 Storyboard 的 context.track?

**A**: 使用 `useMemo` 自动追踪依赖:

```tsx
const fullName = useMemo(() => {
  return firstName + lastName;
}, [firstName, lastName]);
```

### Q3: 如何处理异步 Context 的 transform?

**A**: 使用 `useMemo` 转换数据:

```tsx
const { data: rawData } = useProvider("my-provider", []);
const transformedData = useMemo(() => {
  return rawData?.map((item) => item.name) || [];
}, [rawData]);
```

### Q4: 如何实现构件方法调用?

**A**: 使用 `useRef` + 方法调用:

```tsx
const brickRef = useRef<BrickElement>(null);
brickRef.current?.someMethod(args);
```

### Q5: useProvider 什么时候自动加载,什么时候需要手动触发?

**A**:

- 第二个参数是数组 → 自动加载,依赖变化时重新加载
- 第二个参数是 `null` → 懒加载,需要手动调用 `query`

### Q6: 如何处理 Storyboard 的 poll (轮询)?

**A**: 使用 `setInterval` + `useEffect`:

```tsx
useEffect(() => {
  const timer = setInterval(async () => {
    const result = await query([args]);
    if (result.status === "completed") {
      clearInterval(timer);
    }
  }, interval);

  return () => clearInterval(timer);
}, []);
```

---

# 第十一部分: 转换工作流

## 11.1 转换步骤

### 步骤 1: 分析 Storyboard 配置

**任务清单**:

- [ ] 读取完整的 Storyboard 配置 (YAML/JSON)
- [ ] 识别路由配置 (`RouteConf`)
- [ ] 识别构件列表 (`bricks`)
- [ ] 识别 Context 配置 (`context`)
- [ ] 识别事件配置 (`events`)
- [ ] 识别生命周期 (`lifeCycle`)

### 步骤 2: 创建 React 组件框架

**任务清单**:

- [ ] 创建函数组件
- [ ] 添加必要的 import 语句
- [ ] 添加类型定义

**模板**:

```tsx
import React, { useState, useEffect } from "react";
import { wrapBrick } from "@next-core/react-element";
import { useProvider, useHistory, useParams } from "@next-core/react-runtime";

export function MyPage() {
  // State declarations

  // Hooks

  // Event handlers

  // Effects

  // Render
  return <div>{/* JSX */}</div>;
}
```

### 步骤 3: 转换 Context → State

**任务清单**:

- [ ] 自由变量 → `useState`
- [ ] 异步 resolve → `useProvider`
- [ ] track → `useMemo`
- [ ] onChange → `useEffect`

### 步骤 4: 转换 Bricks → JSX

**任务清单**:

- [ ] 包装构件 (`wrapBrick`)
- [ ] 转换属性 (properties → props)
- [ ] 转换插槽 (slots → children)
- [ ] 转换条件渲染 (if → `&&` / `?:`)

### 步骤 5: 转换 Events → 事件处理函数

**任务清单**:

- [ ] 创建事件处理函数
- [ ] 转换内置 actions
- [ ] 转换 useProvider 调用
- [ ] 转换 callback (success/error/finally)
- [ ] 处理条件判断 (if)

### 步骤 6: 转换 LifeCycle → useEffect

**任务清单**:

- [ ] onMount → `useEffect(() => { ... }, [])`
- [ ] onUnmount → `useEffect(() => () => { ... }, [])`
- [ ] onPageLoad → `useEffect(() => { ... }, [])`

### 步骤 7: 处理动态表达式

**任务清单**:

- [ ] 移除 `<% %>` 标记
- [ ] 替换全局对象 (CTX/APP/PATH/QUERY 等)
- [ ] 确保变量正确引用

### 步骤 8: 优化和完善

**任务清单**:

- [ ] 添加 TypeScript 类型
- [ ] 使用 `useMemo` / `useCallback` 优化
- [ ] 添加错误处理
- [ ] 添加加载状态
- [ ] 添加注释

## 11.2 转换检查清单

### 功能完整性检查

- [ ] 所有 Context 都已转换为 State
- [ ] 所有构件都已正确渲染
- [ ] 所有事件都有对应的处理函数
- [ ] 所有生命周期都已转换
- [ ] 所有条件渲染都正确实现
- [ ] 所有动态表达式都已处理

### 语法正确性检查

- [ ] import 语句完整
- [ ] 类型定义正确
- [ ] useState 初始值类型匹配
- [ ] useEffect 依赖数组完整
- [ ] 事件处理函数签名正确
- [ ] JSX 语法正确

### 行为一致性检查

- [ ] 页面渲染结果与原配置一致
- [ ] 事件触发行为一致
- [ ] 数据加载时机一致
- [ ] 条件判断逻辑一致
- [ ] 路由跳转行为一致

### 性能检查

- [ ] 是否使用了 `wrapBrick` 而非 `ReactUseBrick`
- [ ] 是否正确使用了 `useMemo` / `useCallback`
- [ ] 是否有不必要的重复渲染
- [ ] useEffect 依赖数组是否最小化

### 代码质量检查

- [ ] 变量命名清晰
- [ ] 函数命名符合约定
- [ ] 代码结构清晰
- [ ] 关键逻辑有注释
- [ ] 没有冗余代码

---

# 总结

本文档提供了将 Brick Next 框架的 Storyboard 配置转换为 React 组件的完整指南,包括:

✅ **11 个完整章节**:覆盖从基础概念到高级场景的所有转换规则

✅ **4 个核心映射表**:构件、数据、事件、生命周期的完整映射关系

✅ **20+ 详细转换规则**:每个规则都包含 Before/After 示例和关键注释

✅ **3 个完整示例**:真实场景的端到端转换示例

✅ **转换决策树**:帮助快速选择正确的转换方式

✅ **最佳实践**:性能优化、类型安全、常见陷阱等

✅ **快速参考**:速查表和常见模式代码片段

✅ **转换工作流**:完整的步骤指南和检查清单

## 如何使用本文档

### 对于 AI 大模型

1. 阅读第二、三部分了解核心映射规则
2. 使用决策树判断使用哪种转换方式
3. 参考第四、六、七部分的详细示例进行转换
4. 使用第十一部分的工作流确保转换完整

### 对于开发工程师

1. 快速索引 (§1.4) 找到需要的章节
2. 参考完整示例 (第五部分) 理解整体结构
3. 使用快速参考卡片 (第九部分) 查找常见模式
4. 遇到问题查看疑难解答 (§10.3)

---

**文档完成** ✅

版本: v1.0 | 创建日期: 2026-01-22 | 总页数: 约 70 页 (3500+ 行)
