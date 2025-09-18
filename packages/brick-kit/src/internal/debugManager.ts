class DebugManager {
  private static instance: DebugManager;
  private debugMode = false;
  private debugType: "session" | "persistent" | "none" = "none";

  static getInstance(): DebugManager {
    if (!DebugManager.instance) {
      DebugManager.instance = new DebugManager();
    }
    return DebugManager.instance;
  }

  constructor() {
    this.initDebugMode();
    this.setupWindowAPI();
  }

  private initDebugMode(): void {
    // 1. 首先检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const debugFromUrl = urlParams.get("__debugConsole__");

    if (debugFromUrl === "true") {
      this.activateSessionDebug();
      return;
    }

    // 2. 检查localStorage（内部人员长期调试）
    const persistentDebug = localStorage.getItem("debugConsole");
    if (persistentDebug === "true") {
      this.debugMode = true;
      this.debugType = "persistent";
      // eslint-disable-next-line no-console
      console.log("🔧 调试模式已开启（持久模式 - 内部调试）");
      return;
    }

    // 3. 检查sessionStorage（客户临时调试）
    const sessionDebug = sessionStorage.getItem("debugConsole");
    if (sessionDebug === "true") {
      this.debugMode = true;
      this.debugType = "session";
      // eslint-disable-next-line no-console
      console.log("🔧 调试模式已开启（会话模式 - 关闭标签页后失效）");
      return;
    }

    // 4. 检查日志级别设置
  }

  private activateSessionDebug(): void {
    this.debugMode = true;
    this.debugType = "session";
    sessionStorage.setItem("debugConsole", "true");
    // eslint-disable-next-line no-console
    console.log("🔧 调试模式已通过URL参数激活（会话模式）");
  }

  private setupWindowAPI(): void {
    (window as any).debugConsole = {
      // 开启会话调试模式（客户现场使用）
      enable: () => {
        this.debugMode = true;
        this.debugType = "session";
        sessionStorage.setItem("debugConsole", "true");
        // eslint-disable-next-line no-console
        console.log("🔧 调试模式已开启（会话模式 - 关闭标签页后失效）");
        return this.debugMode;
      },

      // 开启持久调试模式（内部人员使用）
      enablePersistent: () => {
        this.debugMode = true;
        this.debugType = "persistent";
        localStorage.setItem("debugConsole", "true");
        // eslint-disable-next-line no-console
        console.log("🔧 调试模式已开启（持久模式 - 内部调试）");
        return this.debugMode;
      },

      // 关闭调试模式
      disable: () => {
        this.debugMode = false;
        this.debugType = "none";
        sessionStorage.removeItem("debugConsole");
        localStorage.removeItem("debugConsole");
        // eslint-disable-next-line no-console
        console.log("🔧 调试模式已关闭");
        return this.debugMode;
      },

      // 切换调试模式
      toggle: () => {
        if (this.debugMode) {
          this.debugMode = false;
          this.debugType = "none";
          sessionStorage.removeItem("debugConsole");
          localStorage.removeItem("debugConsole");
          // eslint-disable-next-line no-console
          console.log("🔧 调试模式已关闭");
        } else {
          this.debugMode = true;
          this.debugType = "session";
          sessionStorage.setItem("debugConsole", "true");
          // eslint-disable-next-line no-console
          console.log("🔧 调试模式已开启（会话模式 - 关闭标签页后失效）");
        }
        return this.debugMode;
      },

      // 切换持久调试模式
      togglePersistent: () => {
        if (this.debugMode && this.debugType === "persistent") {
          this.debugMode = false;
          this.debugType = "none";
          sessionStorage.removeItem("debugConsole");
          localStorage.removeItem("debugConsole");
          // eslint-disable-next-line no-console
          console.log("🔧 调试模式已关闭");
        } else {
          this.debugMode = true;
          this.debugType = "persistent";
          localStorage.setItem("debugConsole", "true");
          // eslint-disable-next-line no-console
          console.log("🔧 调试模式已开启（持久模式 - 内部调试）");
        }
        return this.debugMode;
      },

      // 获取当前状态
      status: () => {
        const status = {
          debugMode: this.debugMode,
          debugType: this.debugType,
          description: this.getStatusDescription(),
        };
        // eslint-disable-next-line no-console
        console.log("🔧 调试状态:", status);
        return status;
      },
      // 帮助信息
      help: () => {
        // eslint-disable-next-line no-console
        console.log(`
🔧 混合调试控制台使用说明：

👥 生产环境使用（临时调试）：
  window.debugConsole.enable()     - 开启会话调试（关闭标签页后失效）
  window.debugConsole.disable()    - 关闭调试模式
  window.debugConsole.toggle()     - 切换会话调试模式

👨‍💻 开发人员使用（长期调试）：
  window.debugConsole.enablePersistent()  - 开启持久调试（长期有效）
  window.debugConsole.togglePersistent()  - 切换持久调试模式
  window.debugConsole.disable()           - 关闭调试模式

🔍 其他功能：
  window.debugConsole.status()     - 查看当前状态
  window.debugConsole.help()       - 显示此帮助信息

🌐 URL参数：
  ?__debugConsole__=true  - 通过URL激活会话调试模式

📝 说明：
  - 会话模式：刷新页面后仍然有效，关闭标签页后失效
  - 持久模式：长期有效，除非手动关闭
        `);
      },
    };

    // 显示初始状态
    if (this.debugMode) {
      // eslint-disable-next-line no-console
      console.log(
        `🔧 调试模式已开启（${
          this.debugType === "persistent" ? "持久模式" : "会话模式"
        }）`
      );
    } else {
      // eslint-disable-next-line no-console
      console.log("💡 提示：使用 window.debugConsole.help() 查看使用说明");
    }
  }

  private getStatusDescription(): string {
    if (!this.debugMode) {
      return "调试模式已关闭";
    }

    switch (this.debugType) {
      case "persistent":
        return "持久模式 - 内部调试（长期有效）";
      case "session":
        return "会话模式 - 临时调试（关闭标签页后失效）";
      default:
        return "未知模式";
    }
  }

  isDebugMode(): boolean {
    return this.debugMode;
  }

  getDebugType(): "session" | "persistent" | "none" {
    return this.debugType;
  }

  shouldLog(method: "log" | "error" | "warn" | "info"): boolean {
    return method === "error" ? true : this.debugMode;
  }
}

export const debugManager = DebugManager.getInstance();
