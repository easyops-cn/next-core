/* eslint-disable no-console -- allow console.log in this file */
import { debugManager } from "./debugManager.js";

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});
Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

// Mock URLSearchParams
const mockURLSearchParams = jest.fn();
Object.defineProperty(window, "URLSearchParams", {
  value: mockURLSearchParams,
});

// Mock console.log to avoid test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe("debugManager", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
    mockURLSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });

    // Reset the singleton instance by clearing the static property
    const DebugManagerClass = debugManager.constructor as any;
    DebugManagerClass.instance = undefined;
  });

  test("should initialize with no debug mode by default", () => {
    const manager = debugManager;
    expect(manager.isDebugMode()).toBe(false);
    expect(manager.getDebugType()).toBe("none");
  });

  test("should enable session debug mode", () => {
    const manager = debugManager;
    (window as any).debugConsole.enable();

    expect(manager.isDebugMode()).toBe(true);
    expect(manager.getDebugType()).toBe("session");
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      "debugConsole",
      "true"
    );
    expect(console.log).toHaveBeenCalledWith(
      "🔧 调试模式已开启（会话模式 - 关闭标签页后失效）"
    );
  });

  test("should enable persistent debug mode", () => {
    const manager = debugManager;
    (window as any).debugConsole.enablePersistent();

    expect(manager.isDebugMode()).toBe(true);
    expect(manager.getDebugType()).toBe("persistent");
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "debugConsole",
      "true"
    );
    expect(console.log).toHaveBeenCalledWith(
      "🔧 调试模式已开启（持久模式 - 内部调试）"
    );
  });

  test("should disable debug mode", () => {
    const manager = debugManager;
    (window as any).debugConsole.enable();
    (window as any).debugConsole.disable();

    expect(manager.isDebugMode()).toBe(false);
    expect(manager.getDebugType()).toBe("none");
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith("debugConsole");
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("debugConsole");
    expect(console.log).toHaveBeenCalledWith("🔧 调试模式已关闭");
  });

  test("should toggle debug mode", () => {
    const manager = debugManager;

    // Initially disabled
    expect(manager.isDebugMode()).toBe(false);

    // Toggle to enabled
    (window as any).debugConsole.toggle();
    expect(manager.isDebugMode()).toBe(true);
    expect(manager.getDebugType()).toBe("session");
    expect(console.log).toHaveBeenCalledWith(
      "🔧 调试模式已开启（会话模式 - 关闭标签页后失效）"
    );

    // Toggle to disabled
    (window as any).debugConsole.toggle();
    expect(manager.isDebugMode()).toBe(false);
    expect(manager.getDebugType()).toBe("none");
    expect(console.log).toHaveBeenCalledWith("🔧 调试模式已关闭");
  });

  test("should toggle persistent debug mode", () => {
    const manager = debugManager;

    // Initially disabled
    expect(manager.isDebugMode()).toBe(false);

    // Toggle to persistent enabled
    (window as any).debugConsole.togglePersistent();
    expect(manager.isDebugMode()).toBe(true);
    expect(manager.getDebugType()).toBe("persistent");
    expect(console.log).toHaveBeenCalledWith(
      "🔧 调试模式已开启（持久模式 - 内部调试）"
    );

    // Toggle to disabled
    (window as any).debugConsole.togglePersistent();
    expect(manager.isDebugMode()).toBe(false);
    expect(manager.getDebugType()).toBe("none");
    expect(console.log).toHaveBeenCalledWith("🔧 调试模式已关闭");
  });

  test("should check if method should log based on debug mode", () => {
    const manager = debugManager;

    // Debug mode is disabled by default
    expect(manager.shouldLog("log")).toBe(false);
    expect(manager.shouldLog("info")).toBe(false);
    expect(manager.shouldLog("warn")).toBe(false);
    expect(manager.shouldLog("error")).toBe(true); // error always logs

    // Enable debug mode
    (window as any).debugConsole.enable();
    expect(manager.shouldLog("log")).toBe(true);
    expect(manager.shouldLog("info")).toBe(true);
    expect(manager.shouldLog("warn")).toBe(true);
    expect(manager.shouldLog("error")).toBe(true);

    // Disable debug mode
    (window as any).debugConsole.disable();
    expect(manager.shouldLog("log")).toBe(false);
    expect(manager.shouldLog("info")).toBe(false);
    expect(manager.shouldLog("warn")).toBe(false);
    expect(manager.shouldLog("error")).toBe(true); // error always logs
  });

  test("should always log error messages", () => {
    const manager = debugManager;

    // Error messages should always log regardless of debug mode
    expect(manager.shouldLog("error")).toBe(true);

    // Enable debug mode
    (window as any).debugConsole.enable();
    expect(manager.shouldLog("error")).toBe(true);

    // Disable debug mode
    (window as any).debugConsole.disable();
    expect(manager.shouldLog("error")).toBe(true);
  });

  test("should initialize from localStorage persistent debug", () => {
    localStorageMock.getItem.mockReturnValue("true");

    // Create a new instance to test initialization
    const DebugManagerClass = debugManager.constructor as any;
    DebugManagerClass.instance = undefined;
    const manager = new DebugManagerClass();

    expect(manager.isDebugMode()).toBe(true);
    expect(manager.getDebugType()).toBe("persistent");
    expect(console.log).toHaveBeenCalledWith(
      "🔧 调试模式已开启（持久模式 - 内部调试）"
    );
  });

  test("should initialize from sessionStorage session debug", () => {
    sessionStorageMock.getItem.mockReturnValue("true");

    // Create a new instance to test initialization
    const DebugManagerClass = debugManager.constructor as any;
    DebugManagerClass.instance = undefined;
    const manager = new DebugManagerClass();

    expect(manager.isDebugMode()).toBe(true);
    expect(manager.getDebugType()).toBe("session");
    expect(console.log).toHaveBeenCalledWith(
      "🔧 调试模式已开启（会话模式 - 关闭标签页后失效）"
    );
  });

  test("should initialize from URL parameter", () => {
    mockURLSearchParams.mockReturnValue({
      get: (key: string) => {
        if (key === "__debugConsole__") {
          return "true";
        }
        return null;
      },
    });

    // Create a new instance to test initialization
    const DebugManagerClass = debugManager.constructor as any;
    DebugManagerClass.instance = undefined;
    const manager = new DebugManagerClass();

    expect(manager.isDebugMode()).toBe(true);
    expect(manager.getDebugType()).toBe("session");
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      "debugConsole",
      "true"
    );
    expect(console.log).toHaveBeenCalledWith(
      "🔧 调试模式已通过URL参数激活（会话模式）"
    );
  });

  test("should display status correctly", () => {
    // First disable debug mode to ensure clean state
    (window as any).debugConsole.disable();

    // Test disabled status
    const disabledStatus = (window as any).debugConsole.status();
    expect(disabledStatus.debugMode).toBe(false);
    expect(disabledStatus.debugType).toBe("none");
    expect(console.log).toHaveBeenCalledWith("🔧 调试状态:", disabledStatus);

    // Test enabled status
    (window as any).debugConsole.enable();
    const enabledStatus = (window as any).debugConsole.status();
    expect(enabledStatus.debugMode).toBe(true);
    expect(enabledStatus.debugType).toBe("session");
  });

  test("should display help information", () => {
    (window as any).debugConsole.help();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("🔧 混合调试控制台使用说明")
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("👥 生产环境使用（临时调试）")
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("👨‍💻 开发人员使用（长期调试）")
    );
  });

  test("should display initial status when debug mode is enabled", () => {
    // Mock debug mode enabled
    localStorageMock.getItem.mockReturnValue("true");

    // Create a new instance to test initialization
    const DebugManagerClass = debugManager.constructor as any;
    DebugManagerClass.instance = undefined;
    const _manager = new DebugManagerClass();

    expect(console.log).toHaveBeenCalledWith("🔧 调试模式已开启（持久模式）");
  });

  test("should display initial status when debug mode is disabled", () => {
    // Mock debug mode disabled (default)
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);

    // Create a new instance to test initialization
    const DebugManagerClass = debugManager.constructor as any;
    DebugManagerClass.instance = undefined;
    const _manager = new DebugManagerClass();

    expect(console.log).not.toHaveBeenCalled();
  });
});
