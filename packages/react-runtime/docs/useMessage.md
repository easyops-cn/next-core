# useMessage Hook 使用示例

## 基本用法

```tsx
import { useMessage } from "@next-core/react-runtime";

function MyComponent() {
  const message = useMessage();

  const handleSuccess = () => {
    message.success("操作成功!");
  };

  const handleError = () => {
    message.error("操作失败!");
  };

  const handleInfo = () => {
    message.info("这是一条提示信息");
  };

  const handleWarn = () => {
    message.warn("这是一条警告信息");
  };

  return (
    <div>
      <button onClick={handleSuccess}>成功提示</button>
      <button onClick={handleError}>错误提示</button>
      <button onClick={handleInfo}>信息提示</button>
      <button onClick={handleWarn}>警告提示</button>
    </div>
  );
}
```

## 在异步操作中使用

```tsx
import { useMessage, useProvider } from "@next-core/react-runtime";
import { useState } from "react";

function UserForm() {
  const message = useMessage();
  const [formData, setFormData] = useState({ name: "", email: "" });
  const { query: saveUser, loading } = useProvider("api.save-user", null);

  const handleSubmit = async () => {
    try {
      await saveUser([formData]);
      message.success("用户保存成功!");
    } catch (error: any) {
      message.error(`保存失败: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单内容 */}
      <button type="submit" disabled={loading}>
        保存
      </button>
    </form>
  );
}
```

## 条件消息提示

```tsx
import { useMessage } from "@next-core/react-runtime";
import { useState } from "react";

function DeleteButton() {
  const message = useMessage();
  const [hasPermission, setHasPermission] = useState(false);

  const handleDelete = () => {
    if (hasPermission) {
      message.success("删除成功");
      // 执行删除操作
    } else {
      message.error("没有删除权限");
    }
  };

  return <button onClick={handleDelete}>删除</button>;
}
```

## API

### useMessage()

返回一个 `message` 对象,包含以下方法:

#### message.success(text: string)

显示成功提示消息。

#### message.error(text: string)

显示错误提示消息。

#### message.info(text: string)

显示信息提示消息。

#### message.warn(text: string)

显示警告提示消息。

## 与 Storyboard 的对应关系

| Storyboard Action         | React Hook 用法         |
| ------------------------- | ----------------------- |
| `action: message.success` | `message.success(text)` |
| `action: message.error`   | `message.error(text)`   |
| `action: message.info`    | `message.info(text)`    |
| `action: message.warn`    | `message.warn(text)`    |

### 示例对比

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
