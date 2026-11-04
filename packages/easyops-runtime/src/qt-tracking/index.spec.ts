import { describe, test, beforeEach, jest, expect } from "@jest/globals";

const mockUsername = { current: "easyops" as string | undefined };

jest.mock("../auth.js", () => ({
  getAuth: () => ({ userInstanceId: "abc", username: mockUsername.current }),
}));

import { initialize, setUser } from "./index.js";

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
    mockUsername.current = "easyops";
  });

  test("initialize creates queue if absent and pushes pageConfig", () => {
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

  test("initialize keeps existing queue", () => {
    getQueue().push({ action: "existing", arguments: [] });
    initialize();
    expect(getQueue()[0].action).toBe("existing");
  });

  test("setUser binds username", () => {
    setUser();
    expect(getQueue()).toContainEqual({
      action: "aplus.setMetaInfo",
      arguments: ["_user_id", "easyops"],
    });
  });

  test("setUser clears username once when logged out", () => {
    setUser();
    mockUsername.current = undefined;
    setUser();
    setUser();
    const clearCommands = getQueue().filter(
      (item) =>
        item.action === "aplus.setMetaInfo" &&
        item.arguments[0] === "_user_id" &&
        item.arguments[1] === ""
    );
    expect(clearCommands).toHaveLength(1);
  });

  test("setUser ignores logout when username was never set", () => {
    mockUsername.current = undefined;
    setUser();
    expect(getQueue()).toHaveLength(0);
  });
});
