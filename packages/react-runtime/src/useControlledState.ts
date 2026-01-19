import React from "react";
import { isEqual } from "lodash";

/**
 * 受控/非受控混合模式的通用 Hook。
 *
 * 此 hook 允许组件既支持受控模式(由父组件通过 props 控制状态),
 * 也支持非受控模式(组件自己管理内部状态)。
 *
 * **工作原理:**
 * - 当 `propValue !== undefined` 时,组件处于**受控模式**,状态跟随 prop 更新
 * - 当 `propValue === undefined` 时,组件处于**非受控模式**,使用内部状态
 * - 支持深度比较选项,避免复杂对象引用变化导致的不必要更新
 *
 * **使用场景:**
 * 1. 表单组件需要支持受控和非受控两种模式
 * 2. 组件状态可能由父组件控制,也可能自己管理
 * 3. 复杂对象状态需要避免不必要的重新渲染
 *
 * @template T - 状态值的类型
 * @param propValue - 来自 props 的值(undefined 表示非受控模式)
 * @param defaultValue - 默认值(props 为 undefined 时使用)
 * @param deepCompare - 是否使用深度比较(用于复杂对象,默认 false)
 * @returns 返回 [当前值, 设置值的函数],类似 useState
 *
 * @example
 *
 * ```tsx
 * // 简单值(字符串、数字)
 * function MyComponent({ deployed }: { deployed?: string }) {
 *   const [value, setValue] = useControlledState(deployed, 'host');
 *
 *   return (
 *     <select value={value} onChange={(e) => setValue(e.target.value)}>
 *       <option value="host">Host</option>
 *       <option value="container">Container</option>
 *     </select>
 *   );
 * }
 *
 * // 使用方式 1:受控模式
 * <MyComponent deployed="container" />
 *
 * // 使用方式 2:非受控模式
 * <MyComponent />
 * ```
 *
 * @example
 *
 * ```tsx
 * // 复杂对象(启用深度比较)
 * interface Config {
 *   host: string;
 *   port: number;
 * }
 *
 * function ConfigEditor({ config }: { config?: Config }) {
 *   const [value, setValue] = useControlledState<Config | null>(
 *     config,
 *     null,
 *     true // 启用深度比较
 *   );
 *
 *   return <div>{JSON.stringify(value)}</div>;
 * }
 * ```
 *
 * @example
 *
 * ```tsx
 * // 与 onChange 回调结合
 * function Input({
 *   value,
 *   defaultValue = '',
 *   onChange
 * }: {
 *   value?: string;
 *   defaultValue?: string;
 *   onChange?: (val: string) => void;
 * }) {
 *   const [internalValue, setInternalValue] = useControlledState(
 *     value,
 *     defaultValue
 *   );
 *
 *   const handleChange = (newValue: string) => {
 *     setInternalValue(newValue);
 *     onChange?.(newValue);
 *   };
 *
 *   return (
 *     <input
 *       value={internalValue}
 *       onChange={(e) => handleChange(e.target.value)}
 *     />
 *   );
 * }
 * ```
 */
export function useControlledState<T>(
  propValue: T | undefined,
  defaultValue: T,
  deepCompare = false
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // 初始化内部状态
  // 如果 propValue 不是 undefined,使用 propValue;否则使用 defaultValue
  const [internalValue, setInternalValue] = React.useState<T>(
    propValue !== undefined ? propValue : defaultValue
  );

  const isControlled = propValue !== undefined;

  // 在受控模式下同步 propValue 到 internalValue
  React.useEffect(() => {
    if (isControlled) {
      if (deepCompare) {
        // 深度比较模式:只有值真正变化时才更新
        setInternalValue((prev) =>
          isEqual(prev, propValue) ? prev : propValue
        );
      } else {
        // 浅比较模式:直接更新(React 会自动优化相同值)
        setInternalValue(propValue);
      }
    }
    // 注意:当 propValue 变为 undefined 时,不更新 internalValue
    // 这样可以保持最后一次的值,实现从受控切换到非受控的平滑过渡
  }, [isControlled, propValue, deepCompare]);

  // 计算最终返回的值
  let value: T;
  if (isControlled) {
    if (deepCompare) {
      // 深度比较模式:如果内容相同,返回 internalValue 保持引用稳定
      // 否则返回 propValue
      value = isEqual(internalValue, propValue) ? internalValue : propValue;
    } else {
      // 浅比较模式:直接返回 propValue,确保受控模式下值始终同步
      value = propValue;
    }
  } else {
    // 非受控模式:返回 internalValue
    value = internalValue;
  }

  return [value, setInternalValue];
}
