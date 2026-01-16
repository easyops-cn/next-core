import { describe, it, expect } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import { useControlledState } from "./useControlledState.js";

describe("useControlledState", () => {
  describe("基本功能", () => {
    it("should use propValue when provided (controlled mode)", () => {
      const { result } = renderHook(() =>
        useControlledState("controlled", "default")
      );

      expect(result.current[0]).toBe("controlled");
    });

    it("should use defaultValue when propValue is undefined (uncontrolled mode)", () => {
      const { result } = renderHook(() =>
        useControlledState(undefined, "default")
      );

      expect(result.current[0]).toBe("default");
    });

    it("should update when propValue changes (controlled mode)", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useControlledState(value, "default"),
        { initialProps: { value: "initial" as string | undefined } }
      );

      expect(result.current[0]).toBe("initial");

      // 更新 propValue
      rerender({ value: "updated" });
      expect(result.current[0]).toBe("updated");
    });

    it("should allow internal state changes in uncontrolled mode", () => {
      const { result } = renderHook(() =>
        useControlledState(undefined, "default")
      );

      expect(result.current[0]).toBe("default");

      // 内部修改状态
      act(() => {
        result.current[1]("changed");
      });

      expect(result.current[0]).toBe("changed");
    });
  });

  describe("受控/非受控切换", () => {
    it("should switch from uncontrolled to controlled", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useControlledState(value, "default"),
        { initialProps: { value: undefined as string | undefined } }
      );

      // 初始为非受控模式
      expect(result.current[0]).toBe("default");

      // 内部修改
      act(() => {
        result.current[1]("internal");
      });
      expect(result.current[0]).toBe("internal");

      // 切换到受控模式
      rerender({ value: "controlled" });
      expect(result.current[0]).toBe("controlled");

      // 在受控模式下，内部修改会被 useEffect 立即覆盖回 propValue
      act(() => {
        result.current[1]("try-change");
      });

      // 由于 useEffect 会在下次渲染时同步 propValue，所以应该还是 controlled
      rerender({ value: "controlled" });
      expect(result.current[0]).toBe("controlled");
    });

    it("should switch from controlled to uncontrolled", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useControlledState(value, "default"),
        { initialProps: { value: "controlled" as string | undefined } }
      );

      // 初始为受控模式
      expect(result.current[0]).toBe("controlled");

      // 切换到非受控模式
      rerender({ value: undefined });

      // 应该保持最后的受控值
      expect(result.current[0]).toBe("controlled");

      // 现在可以内部修改
      act(() => {
        result.current[1]("uncontrolled-change");
      });
      expect(result.current[0]).toBe("uncontrolled-change");
    });
  });

  describe("浅比较模式（默认）", () => {
    it("should update on every propValue change without deepCompare", () => {
      const { result, rerender } = renderHook(
        ({ value }) => {
          return useControlledState(value, "default", false);
        },
        { initialProps: { value: "value1" as string | undefined } }
      );

      // 更新为相同的值（浅比较会触发状态更新，但 React 会优化）
      rerender({ value: "value1" });

      // 更新为不同的值
      rerender({ value: "value2" });
      expect(result.current[0]).toBe("value2");
    });
  });

  describe("深度比较模式", () => {
    it("should not update when object reference changes but content is same", () => {
      interface Config {
        host: string;
        port: number;
      }

      const initialConfig: Config = { host: "localhost", port: 3000 };

      const { result, rerender } = renderHook(
        ({ value }) => useControlledState(value, initialConfig, true),
        { initialProps: { value: initialConfig } }
      );

      expect(result.current[0]).toEqual({ host: "localhost", port: 3000 });

      // 创建内容相同但引用不同的对象
      const sameContentConfig: Config = { host: "localhost", port: 3000 };
      rerender({ value: sameContentConfig });

      // 深度比较应该识别出内容相同，不更新状态
      expect(result.current[0]).toBe(initialConfig); // 引用应该保持不变
    });

    it("should update when object content actually changes with deepCompare", () => {
      interface Config {
        host: string;
        port: number;
      }

      const initialConfig: Config = { host: "localhost", port: 3000 };

      const { result, rerender } = renderHook(
        ({ value }) => useControlledState(value, initialConfig, true),
        { initialProps: { value: initialConfig } }
      );

      expect(result.current[0]).toEqual({ host: "localhost", port: 3000 });

      // 更新为内容不同的对象
      const newConfig: Config = { host: "localhost", port: 8080 };
      rerender({ value: newConfig });

      expect(result.current[0]).toEqual({ host: "localhost", port: 8080 });
      expect(result.current[0]).toBe(newConfig); // 引用应该更新
    });

    it("should handle complex nested objects with deepCompare", () => {
      interface NestedConfig {
        server: {
          host: string;
          port: number;
        };
        features: string[];
      }

      const initialConfig: NestedConfig = {
        server: { host: "localhost", port: 3000 },
        features: ["auth", "logging"],
      };

      const { result, rerender } = renderHook(
        ({ value }) => useControlledState(value, initialConfig, true),
        { initialProps: { value: initialConfig } }
      );

      // 内容相同的新对象
      const sameConfig: NestedConfig = {
        server: { host: "localhost", port: 3000 },
        features: ["auth", "logging"],
      };
      rerender({ value: sameConfig });

      // 应该保持原引用（深度相等）
      expect(result.current[0]).toBe(initialConfig);

      // 内容不同的新对象
      const differentConfig: NestedConfig = {
        server: { host: "localhost", port: 3000 },
        features: ["auth", "logging", "analytics"], // 新增了 analytics
      };
      rerender({ value: differentConfig });

      // 应该更新为新引用
      expect(result.current[0]).toBe(differentConfig);
      expect(result.current[0].features).toHaveLength(3);
    });
  });

  describe("边界情况", () => {
    it("should handle null values", () => {
      const { result } = renderHook(() =>
        useControlledState<string | null>(null, "default")
      );

      expect(result.current[0]).toBe(null);
    });

    it("should handle undefined defaultValue", () => {
      const { result } = renderHook(() =>
        useControlledState<string | undefined>(undefined, undefined)
      );

      expect(result.current[0]).toBe(undefined);
    });

    it("should handle boolean values", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useControlledState(value, false),
        { initialProps: { value: true as boolean | undefined } }
      );

      expect(result.current[0]).toBe(true);

      rerender({ value: false });
      expect(result.current[0]).toBe(false);

      rerender({ value: undefined });
      expect(result.current[0]).toBe(false); // 保持最后的值
    });

    it("should handle number values including 0", () => {
      const { result } = renderHook(() => useControlledState(0, 100));

      expect(result.current[0]).toBe(0);
    });

    it("should handle arrays with deepCompare", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useControlledState(value, [1, 2, 3], true),
        { initialProps: { value: [1, 2, 3] } }
      );

      expect(result.current[0]).toEqual([1, 2, 3]);

      // 内容相同的新数组
      rerender({ value: [1, 2, 3] });
      expect(result.current[0]).toEqual([1, 2, 3]);

      // 内容不同的数组
      rerender({ value: [1, 2, 3, 4] });
      expect(result.current[0]).toEqual([1, 2, 3, 4]);
    });
  });

  describe("setState 功能", () => {
    it("should support function updater in uncontrolled mode", () => {
      const { result } = renderHook(() => useControlledState(undefined, 10));

      expect(result.current[0]).toBe(10);

      // 使用函数式更新
      act(() => {
        result.current[1]((prev) => prev + 5);
      });

      expect(result.current[0]).toBe(15);
    });

    it("should support function updater in controlled mode", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useControlledState(value, 10),
        { initialProps: { value: 20 as number | undefined } }
      );

      expect(result.current[0]).toBe(20);

      // 在受控模式下使用函数式更新
      act(() => {
        result.current[1]((prev) => prev + 5);
      });

      // 由于是受控模式，propValue 会覆盖内部状态
      // 需要 rerender 触发 useEffect
      rerender({ value: 20 });
      expect(result.current[0]).toBe(20);

      // 如果 propValue 变化，会被正确更新
      rerender({ value: 30 });
      expect(result.current[0]).toBe(30);
    });
  });
});
