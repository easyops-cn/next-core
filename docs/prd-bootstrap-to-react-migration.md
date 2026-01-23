# PRD: 编排框架到 React 大构件迁移工具

## 文档信息

| 项目         | 内容              |
| ------------ | ----------------- |
| **文档版本** | v2.0 (完整版)     |
| **创建日期** | 2026-01-22        |
| **负责人**   | Alex              |
| **状态**     | 需求评审中        |
| **协作者**   | Claude Sonnet 4.5 |

---

## 一、需求背景

### 1.1 当前痛点

**现状:**

- 公司自研的微应用编排框架通过 `bootstrap.json` 配置大量小构件(brick)来组成页面
- 框架运行时需要解析复杂的 storyboard 配置,包括:
  - 动态属性计算 (expressions: `<% CTX.xxx %>`)
  - 条件渲染 (if/permissionsPreCheck)
  - 事件绑定和处理 (events/handlers)
  - 生命周期钩子 (lifeCycle)
  - 数据流转 (resolves/providers)
- 每个页面由多个小 brick 组成,运行时开销大

**问题:**

1. **性能问题**: 运行时解析和渲染大量小构件,首屏加载慢
2. **开发体验差**: 配置式开发,缺少 TypeScript 类型支持,调试困难
3. **维护成本高**: 业务逻辑分散在配置文件中,难以理解和重构
4. **现代化不足**: 无法充分利用 React 生态和工具链

### 1.2 业务目标

**战略目标:**

- 从"多小构件编排"模式迁移到"一页一大构件"的 React 化架构
- 保持框架能力(wrapBrick 加载公共/业务组件 brick)
- 提升开发效率和应用性能

**技术目标:**

- 一个路由对应一个 React 大构件
- 使用 React Hooks 替代框架内置 API
- 支持渐进式迁移(新旧并存)
- 通过 AI 辅助自动化转换

---

## 二、目标用户

### 2.1 主要用户

| 用户角色           | 使用场景                   | 痛点                      |
| ------------------ | -------------------------- | ------------------------- |
| **前端开发工程师** | 日常开发新功能或重构旧页面 | 手动转换工作量大,容易出错 |
| **技术负责人**     | 制定迁移计划,评估风险      | 需要可控的渐进式迁移方案  |
| **架构师**         | 设计转换规则,维护工具      | 需要灵活的扩展机制        |

### 2.2 用户画像

**典型用户: 前端开发工程师 - 张三**

- 工作年限: 3-5 年
- 技术栈: React + TypeScript
- 痛点:
  - 需要迁移 50+ 个页面,手动转换耗时 2-3 周
  - 不熟悉所有框架 API 的 React 等价实现
  - 担心转换后功能不一致
- 期望:
  - AI 自动转换 80% 的代码
  - 提供清晰的转换报告和待办事项
  - 支持增量迁移,不影响现有功能

---

## 三、核心功能

### 3.1 功能架构

```
┌─────────────────────────────────────────────────────────┐
│                   用户交互层                             │
│  - Claude Code Skill: /transform-route                   │
│  - CLI 命令: npx @easyops/brick-transform                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   需求理解层                             │
│  - 读取 route.yaml                                       │
│  - 分析业务语义 (使用 SpecKit)                           │
│  - 生成转换计划 (plan.md)                               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   转换引擎层                             │
│  - YAML AST 解析器                                       │
│  - 语义理解引擎 (识别模式和意图)                         │
│  - React 代码生成器                                      │
│  - Hook 映射规则库                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   验证与测试层                           │
│  - 生成单元测试                                          │
│  - 对比测试 (新旧实现功能一致性)                         │
│  - 生成迁移报告                                          │
└─────────────────────────────────────────────────────────┘
```

### 3.2 功能列表

#### F1: 路由配置解析 (P0)

**功能描述:**

- 读取 `route.yaml` 文件
- 解析 storyboard 配置结构
- 识别关键元素:
  - bricks 列表
  - properties (包括动态表达式)
  - events 和 handlers
  - lifeCycle hooks
  - slots 嵌套结构

**输入:**

```yaml
# route.yaml
bricks:
  - brick: base-layout-v3.tpl-page-layout
    properties:
      pageTitle: <%= CTX.detectDetail?.job?.jobName %>
      menu: <% APP.getMenu("hyper-insight-main-menu") %>
    events:
      validate.success:
        - action: history.push
          args: ["/detail"]
```

**输出:**

```json
{
  "route": "/data-collection/custom-detect/:jobId/edit",
  "bricks": [...],
  "dependencies": ["base-layout-v3", "eo-card"],
  "contextUsage": ["CTX.detectDetail", "APP.getMenu"],
  "complexity": "medium"
}
```

#### F2: 语义理解与转换计划生成 (P0)

**功能描述:**

- 使用 AI (Claude) 理解业务逻辑
- 识别常见模式:
  - 表单提交流程
  - 列表查询展示
  - 详情页展示
  - 弹窗交互
- 生成转换计划 (plan.md)

**输出示例:**

```markdown
# 转换计划: 自定义拨测编辑页

## 业务分析

- 页面类型: 表单编辑页
- 主要功能: 编辑拨测任务配置
- 数据流:
  1. 页面加载时获取任务详情 (CTX.detectDetail)
  2. 表单提交时调用更新 API
  3. 成功后跳转到详情页

## 转换策略

1. 使用 `usePathParams` 获取 jobId
2. 使用 `useProvider` 加载任务详情
3. 使用 `wrapBrick` 包装表单构件
4. 使用 `useHistory` 处理路由跳转

## 待办事项

- [ ] 转换动态表达式 (15 处)
- [ ] 转换事件处理 (3 个)
- [ ] 转换生命周期钩子 (1 个)
- [ ] 生成单元测试
```

#### F3: React 代码生成 (P0)

**功能描述:**

- 根据转换计划生成 React TSX 代码
- 自动导入所需的 hooks 和 wrapBrick
- 生成类型定义

**映射规则:**

| Storyboard 特性        | React 实现                                     |
| ---------------------- | ---------------------------------------------- |
| `<% CTX.xxx %>`        | `const { xxx } = useCurrentApp()`              |
| `<% PATH.xxx %>`       | `const { xxx } = usePathParams()`              |
| `<% QUERY .xxx %>`     | `const { xxx } = useParams()`                  |
| `<% EVENT.detail %>`   | 事件处理函数参数 `(e) => e.detail`             |
| `<% APP.getMenu() %>`  | `const menu = useNavConfig()`                  |
| `history.push`         | `const history = useHistory(); history.push()` |
| `lifeCycle.onPageLoad` | `useEffect(() => { ... }, [])`                 |
| `useResolves`          | `const { data } = useProvider(...)`            |
| `if: <% condition %>`  | `{condition && <Component />}`                 |

**输出示例:**

```tsx
// Pages/DataCollection/CustomDetect/Edit/index.tsx
import React, { useEffect } from "react";
import {
  usePathParams,
  useHistory,
  useProvider,
  useParams,
} from "@next-core/react-runtime";
import { wrapBrick } from "@next-core/react-element";

const PageLayout = wrapBrick("base-layout-v3.tpl-page-layout");
const Card = wrapBrick("eo-card");
const Form = wrapBrick("forms.general-form");

export default function CustomDetectEdit() {
  const { jobId } = usePathParams<{ jobId: string }>();
  const { name } = useParams<{ jobId: string }>();
  const history = useHistory();

  // 加载任务详情
  const { data: detectDetail } = useProvider(
    "collect-api.get-detect-job",
    [jobId],
    []
  );

  const handleSubmit = (e: CustomEvent) => {
    // 处理表单提交
    history.push(
      `/data-collection/custom-detect/${jobId}/summary?name=${name}`
    );
  };

  return (
    <PageLayout pageTitle={detectDetail?.job?.jobName} menu={/* ... */}>
      <Card>
        <Form
          onValidateSuccess={handleSubmit}
          onCancelClick={() => history.goBack()}
        />
      </Card>
    </PageLayout>
  );
}
```

#### F4: 测试生成与验证 (P1)

**功能描述:**

- 生成单元测试框架
- 生成 E2E 测试对比脚本
- 提供功能一致性验证工具

**输出示例:**

```tsx
// Pages/DataCollection/CustomDetect/Edit/index.spec.tsx
import { render, screen } from "@testing-library/react";
import CustomDetectEdit from "./index";

describe("CustomDetectEdit", () => {
  it("should render page title from detectDetail", () => {
    // 测试代码
  });

  it("should navigate to summary page on submit", () => {
    // 测试代码
  });
});
```

#### F5: 迁移报告生成 (P1)

**功能描述:**

- 生成详细的转换报告
- 标记需要人工处理的部分
- 提供转换前后对比

**输出示例:**

```markdown
# 迁移报告: CustomDetectEdit

## 转换统计

- ✅ 自动转换: 85%
- ⚠️ 需要人工确认: 10%
- ❌ 无法自动转换: 5%

## 详细信息

### ✅ 已完成

- [x] 页面布局转换
- [x] 表单构件包装
- [x] 路由跳转逻辑
- [x] 数据加载 (useProvider)

### ⚠️ 需要确认

- [ ] 复杂的条件表达式 (line 45-60)
  - 原始: `<% FN.hasValidDetectAgentByVersionS(...) %>`
  - 建议: 提取为独立函数

### ❌ 需要手动处理

- [ ] 自定义函数 `FN.hasValidDetectAgentByVersionS`
  - 需要在 Utils 中实现对应的 TypeScript 函数

## 风险评估

- 风险等级: 中
- 主要风险: 复杂的业务逻辑表达式需要仔细验证
- 建议: 进行充分的 E2E 测试
```

### 3.3 功能优先级

| 功能                   | 优先级 | 原因                      |
| ---------------------- | ------ | ------------------------- |
| F1: 路由配置解析       | P0     | 基础能力,必须先实现       |
| F2: 语义理解与计划生成 | P0     | 核心价值,AI 辅助的关键    |
| F3: React 代码生成     | P0     | 最终产物,必须实现         |
| F4: 测试生成与验证     | P1     | 保证质量,但可以后续完善   |
| F5: 迁移报告生成       | P1     | 提升体验,但不影响核心功能 |

---

## 四、非功能需求

### 4.1 性能要求

| 指标         | 目标                  | 说明                           |
| ------------ | --------------------- | ------------------------------ |
| **转换速度** | < 30s/页面            | 单个路由的完整转换时间         |
| **准确率**   | > 85%                 | 自动转换的代码可直接使用的比例 |
| **并发处理** | 支持 5 个页面同时转换 | 批量迁移场景                   |

### 4.2 可用性要求

1. **易用性**
   - 提供 Claude Code Skill,一键转换
   - 提供 CLI 工具,支持批量处理
   - 清晰的错误提示和修复建议

2. **可维护性**
   - 转换规则可配置和扩展
   - 支持自定义映射规则
   - 完善的日志和调试信息

3. **兼容性**
   - 支持现有的所有框架 API
   - 生成的代码兼容 TypeScript 5.x
   - 支持 React 18+

### 4.3 安全性要求

1. **代码安全**
   - 不执行不可信的代码
   - 沙箱环境中解析表达式
   - 防止注入攻击

2. **数据安全**
   - 不上传敏感业务代码到外部服务
   - 本地处理为主
   - 可选的远程 MCP Server 需要认证

### 4.4 可扩展性要求

1. **规则扩展**
   - 支持自定义转换规则
   - 支持插件机制
   - 支持团队共享规则库

2. **多仓库支持**
   - 核心逻辑发布为 NPM 包
   - 各仓库独立使用
   - 统一的版本管理

---

## 五、技术方案

### 5.1 架构设计

#### 多仓库复用方案: NPM Package + Claude Code Skill

**方案 A: Shared NPM Package (推荐短期)**

```
┌─────────────────────────────────────────────┐
│  NPM Package: @easyops/brick-transform-core │
│  - 核心转换逻辑                              │
│  - AST 解析器                                │
│  - React 代码生成器                          │
│  - 映射规则库                                │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Claude Code Skill (每个仓库)               │
│  - 读取本地 route.yaml                       │
│  - 调用 @easyops/brick-transform-core       │
│  - 写入生成的 React 文件                     │
└─────────────────────────────────────────────┘

优势:
✅ 核心逻辑统一维护
✅ 各仓库独立使用
✅ 版本控制清晰
✅ 可以发布到内部 NPM
```

**方案 B: MCP Server (推荐长期)**

```
┌─────────────────────────────────────────────┐
│  MCP Server: brick-transform-server          │
│  - 提供统一的转换 API                        │
│  - 支持多仓库连接                            │
│  - 集中管理转换规则                          │
│  - 支持团队协作和规则共享                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Claude Code (各仓库)                        │
│  - 通过 MCP 协议调用转换服务                 │
│  - 本地读写文件                              │
└─────────────────────────────────────────────┘

优势:
✅ 真正的多仓库共享
✅ 可以远程部署
✅ 支持团队协作
✅ 可以集成到 CI/CD
✅ 统一的规则管理和更新
```

**推荐实施路径:**

1. **Phase 1 (MVP)**: 使用 NPM Package 方案,快速验证
2. **Phase 2 (优化)**: 迁移到 MCP Server,支持更复杂场景

### 5.2 核心 API 设计

**NPM Package: `@easyops/brick-transform-core`**

```typescript
// 核心 API
export interface TransformOptions {
  routeYamlPath: string;
  outputDir: string;
  generateTests?: boolean;
  customRules?: TransformRule[];
  aiProvider?: "claude" | "local"; // AI 提供商
}

export async function transformRoute(
  options: TransformOptions
): Promise<TransformResult>;

export interface TransformResult {
  success: boolean;
  outputFiles: string[];
  report: MigrationReport;
  warnings: Warning[];
  errors: Error[];
}

// 自定义规则接口
export interface TransformRule {
  name: string;
  pattern: RegExp | string;
  transform: (match: any, context: TransformContext) => string;
}
```

**Claude Code Skill: `/transform-route`**

```typescript
// .claude/skills/transform-route.ts
import { transformRoute } from "@easyops/brick-transform-core";

export const skill = {
  name: "transform-route",
  description: "将 route.yaml 转换为 React 大构件",

  async execute(args: string[]) {
    const routePath = args[0]; // e.g., "Pages/DataCollection/CustomDetect/Edit"

    // 1. 读取 route.yaml
    const yamlPath = `src/${routePath}/route.yaml`;

    // 2. 使用 SpecKit 生成 PRD 和 Plan (可选)
    if (args.includes("--with-plan")) {
      const plan = await generatePlan(yamlPath);
      console.log("转换计划已生成:", plan);
    }

    // 3. 执行转换
    const result = await transformRoute({
      routeYamlPath: yamlPath,
      outputDir: `src/${routePath}`,
      generateTests: true,
      aiProvider: "claude",
    });

    // 4. 展示结果
    if (result.success) {
      console.log("✅ 转换成功!");
      console.log("生成的文件:", result.outputFiles);
      console.log("\n迁移报告:");
      console.log(result.report);
    } else {
      console.error("❌ 转换失败:", result.errors);
    }

    return result;
  },
};
```

### 5.3 关键技术栈

1. **YAML 解析**: `js-yaml`
2. **AST 处理**: 自定义 AST Walker
3. **代码生成**: `@babel/generator` + 模板引擎
4. **AI 集成**: Claude API (通过 Anthropic SDK)
5. **测试生成**: `@testing-library/react` 模板
6. **MCP 协议**: `@modelcontextprotocol/sdk` (Phase 2)

### 5.4 数据流

```
route.yaml
    ↓
[YAML Parser]
    ↓
AST (抽象语法树)
    ↓
[Semantic Analyzer] ← AI (Claude)
    ↓
Semantic Model (语义模型)
    ↓
[Code Generator]
    ↓
React TSX + Tests
```

---

## 六、实施计划

### 6.1 里程碑

| 阶段                  | 时间     | 交付物                  | 负责人   |
| --------------------- | -------- | ----------------------- | -------- |
| **Phase 1: MVP**      | Week 1-2 | 基础转换能力 (F1, F3)   | 开发团队 |
| **Phase 2: AI 增强**  | Week 3-4 | 语义理解和计划生成 (F2) | AI 团队  |
| **Phase 3: 质量保证** | Week 5-6 | 测试生成和验证 (F4, F5) | QA 团队  |
| **Phase 4: 推广应用** | Week 7-8 | 文档、培训、试点项目    | 全员     |

### 6.2 试点项目

**选择标准:**

- 页面复杂度: 中等 (10-20 个 brick)
- 业务重要性: 非核心业务
- 团队配合度: 高

**推荐试点:**

- 项目: `collect-platform`
- 路由: `Pages/DataCollection/CustomDetect/Edit`
- 预期收益: 转换时间从 4 小时降低到 30 分钟

### 6.3 风险与应对

| 风险                   | 影响 | 概率 | 应对措施                  |
| ---------------------- | ---- | ---- | ------------------------- |
| **AI 理解不准确**      | 高   | 中   | 人工审核机制,提供修正反馈 |
| **复杂表达式转换失败** | 中   | 高   | 标记为待处理,提供转换建议 |
| **性能不达标**         | 中   | 低   | 优化解析算法,使用缓存     |
| **团队接受度低**       | 高   | 中   | 充分培训,提供详细文档     |
| **多仓库版本不一致**   | 中   | 中   | 使用 NPM 统一版本管理     |

---

## 七、成功指标

### 7.1 量化指标

| 指标             | 目标  | 测量方式                       |
| ---------------- | ----- | ------------------------------ |
| **转换准确率**   | > 85% | 自动转换后可直接使用的代码比例 |
| **开发效率提升** | > 50% | 迁移一个页面的时间对比         |
| **性能提升**     | > 30% | 页面首屏加载时间对比           |
| **采用率**       | > 60% | 3 个月内使用工具的项目比例     |

### 7.2 定性指标

- 开发者满意度 > 4.0/5.0
- 代码可维护性显著提升
- 团队技术栈现代化

---

## 八、附录

### 8.1 术语表

| 术语           | 定义                                           |
| -------------- | ---------------------------------------------- |
| **Brick/构件** | 封装的 Custom Element,框架的基本渲染单元       |
| **Storyboard** | 页面编排配置,定义 brick 的组合和交互           |
| **wrapBrick**  | 将 brick 包装为 React 组件的工具函数           |
| **route.yaml** | 单个路由的配置文件,包含该路由的所有 brick 定义 |
| **大构件**     | 一个完整的 React 组件,对应一个路由页面         |
| **SpecKit**    | AI 辅助的需求分析和规划工具                    |

### 8.2 参考资料

- [Next Core V3 文档](https://github.com/easyops-cn/next-core-v3)
- [React Runtime Hooks](./packages/react-runtime/README.md)
- [wrapBrick 使用指南](./packages/react-element/README.md)
- [Claude Code Skill 开发指南](https://docs.anthropic.com/claude-code)

### 8.3 示例项目

- 参考项目: `/Users/alex/Workspace/easyops/next-hyperinsign-pages/apps/collect-platform`
- 示例路由: `src/Pages/DataCollection/CustomDetect/Edit/route.yaml`
- 项目结构:
  ```
  collect-platform/
  ├── src/
  │   ├── Pages/           # 页面路由 (按业务模块组织)
  │   │   ├── DataCollection/
  │   │   │   ├── CustomDetect/
  │   │   │   │   ├── Edit/
  │   │   │   │   │   └── route.yaml  # 单个路由配置
  │   │   ├── DataConversion/
  │   │   └── ...
  │   ├── Components/      # 自定义模板组件
  │   └── Utils/           # 工具函数
  └── bootstrap.json       # 完整的编排配置 (7.5MB)
  ```

### 8.4 转换示例对比

**转换前 (route.yaml):**

```yaml
bricks:
  - brick: base-layout-v3.tpl-page-layout
    properties:
      pageTitle: <%= CTX.detectDetail?.job?.jobName %>
    events:
      validate.success:
        - action: history.push
          args: ["/detail"]
```

**转换后 (index.tsx):**

```tsx
import { wrapBrick } from "@next-core/react-element";
import { useCurrentApp, useHistory } from "@next-core/react-runtime";

const PageLayout = wrapBrick("base-layout-v3.tpl-page-layout");

export default function CustomDetectEdit() {
  const { detectDetail } = useCurrentApp();
  const history = useHistory();

  const handleValidateSuccess = () => {
    history.push("/detail");
  };

  return (
    <PageLayout
      pageTitle={detectDetail?.job?.jobName}
      onValidateSuccess={handleValidateSuccess}
    />
  );
}
```

---

## 变更记录

| 版本 | 日期       | 变更内容                              | 作者                     |
| ---- | ---------- | ------------------------------------- | ------------------------ |
| v1.0 | 2026-01-22 | 初始版本                              | AI Agent (Sisyphus)      |
| v2.0 | 2026-01-22 | 完整版本,增加多仓库方案、详细技术设计 | Alex + Claude Sonnet 4.5 |
