import React from "react";
import { checkPermissions } from "@next-core/easyops-runtime";

/**
 * 检查用户权限的 React hooks。
 *
 * 此 hook 用于检查当前登录用户是否拥有指定的权限操作。
 * 权限必须在 storyboard 配置的 `permissionsPreCheck` 中预先声明，
 * 否则会返回 false 并在控制台输出错误。
 *
 * **工作原理：**
 * - 权限会在路由渲染时自动预检查（通过 `preCheckPermissions`）
 * - 此 hook 查询已缓存的权限结果（同步操作）
 * - 管理员用户始终返回 true
 * - 未登录用户始终返回 false
 *
 * **注意事项：**
 * 1. 权限必须在 `permissionsPreCheck` 中声明
 * 2. 所有传入的 actions 都必须有权限才返回 true
 * 3. 权限检查结果会被缓存，避免重复计算
 *
 * @param actions - 需要检查的权限操作列表
 * @returns 是否拥有所有指定的权限
 *
 * @example
 *
 * ```tsx
 * // 检查单个权限
 * function DeleteButton() {
 *   const canDelete = useCheckPermissions("my-app:user.delete");
 *
 *   if (!canDelete) {
 *     return null;
 *   }
 *
 *   return <button onClick={handleDelete}>Delete</button>;
 * }
 * ```
 *
 * @example
 *
 * ```tsx
 * // 检查多个权限（需要全部拥有）
 * function AdminPanel() {
 *   const hasAccess = useCheckPermissions(
 *     "my-app:admin.read",
 *     "my-app:admin.write"
 *   );
 *
 *   if (!hasAccess) {
 *     return <div>Access Denied</div>;
 *   }
 *
 *   return <div>Admin Panel Content</div>;
 * }
 * ```
 *
 * @example
 *
 * ```tsx
 * // 在 storyboard 中配置权限预检查
 * // routes.yaml
 * routes:
 *   - path: /users
 *     permissionsPreCheck:
 *       - "my-app:user.read"
 *       - "my-app:user.delete"
 *     bricks:
 *       - brick: "my-brick"
 * ```
 */
export function useCheckPermissions(...actions: string[]): boolean {
  // 使用 useMemo 缓存权限检查结果
  // 因为权限在会话期间是稳定的，只依赖于 actions 列表
  return React.useMemo(
    () => checkPermissions.checkPermissions(...actions),
    // 序列化 actions 作为依赖，避免数组引用变化导致重新计算
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(actions)]
  );
}
