import { initialize, setUser } from "./qtTracking";

interface AplusCommand {
  action: string;
  arguments: unknown[];
}

function getQueue(): AplusCommand[] {
  return (window as any).aplus_queue;
}

describe("qtTracking", () => {
  beforeEach(() => {
    (window as any).aplus_queue = [];
    document.head
      .querySelectorAll("script")
      .forEach((script) => script.remove());
  });

  it("initialize creates queue if absent and pushes pageConfig", () => {
    delete (window as any).aplus_queue;
    initialize();
    expect(getQueue()).toBeDefined();
    const pageConfigCommand = getQueue().find(
      (item) =>
        item.action === "aplus.setMetaInfo" &&
        item.arguments[0] === "pageConfig"
    );
    expect(pageConfigCommand?.arguments[1]).toMatchObject({
      hashMode: false,
    });
  });

  it("initialize keeps existing queue", () => {
    getQueue().push({ action: "existing", arguments: [] });
    initialize();
    expect(getQueue()[0].action).toBe("existing");
  });

  it("initialize does not load sdk without sdkSrc", () => {
    initialize();
    expect(document.head.querySelectorAll("script")).toHaveLength(0);
  });

  it("initialize loads sdk script when sdkSrc given", () => {
    initialize({ sdkSrc: "https://qt.example.com/aplus.js" });
    const script = document.head.querySelector("script");
    expect(script?.getAttribute("src")).toBe("https://qt.example.com/aplus.js");
  });

  it("initialize replaces pageConfig when given", () => {
    const pageConfig = {
      hashMode: true,
      "/custom/page": { pageName: "custom_page" },
    };
    initialize({ pageConfig });
    const pageConfigCommand = getQueue().find(
      (item) =>
        item.action === "aplus.setMetaInfo" &&
        item.arguments[0] === "pageConfig"
    );
    expect(pageConfigCommand?.arguments[1]).toBe(pageConfig);
  });

  it("setUser binds username", () => {
    setUser("easyops");
    expect(getQueue()).toContainEqual({
      action: "aplus.setMetaInfo",
      arguments: ["_user_id", "easyops"],
    });
  });

  it("setUser clears username once when logged out", () => {
    setUser("easyops");
    setUser(undefined);
    setUser(undefined);
    const clearCommands = getQueue().filter(
      (item) =>
        item.action === "aplus.setMetaInfo" &&
        item.arguments[0] === "_user_id" &&
        item.arguments[1] === ""
    );
    expect(clearCommands).toHaveLength(1);
  });

  it("setUser ignores logout when username was never set", () => {
    setUser(undefined);
    expect(getQueue()).toHaveLength(0);
  });
});
