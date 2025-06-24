import { describe, jest, test, expect } from "@jest/globals";
import loadSharedModule from "./loadSharedModule.js";

const defaultScope = {
  secret_id: "default",
};
(window as any).__webpack_init_sharing__ = jest.fn(() => Promise.resolve());
(window as any).__webpack_share_scopes__ = { default: defaultScope };

describe("loadSharedModule", () => {
  test("basic", async () => {
    const factory = jest.fn().mockReturnValue("factory result");
    const container = {
      init: jest.fn((_scope: unknown) => Promise.resolve()),
      get: jest.fn((_id: string) => Promise.resolve(factory)),
    };
    (window as any)["bricks/basic"] = container;
    const result = await loadSharedModule("bricks/basic", "./general-button");
    expect(result).toBe("factory result");
    expect(container.init).toHaveBeenCalledWith(defaultScope);
    expect(container.get).toHaveBeenCalledWith("./general-button");
  });
});
