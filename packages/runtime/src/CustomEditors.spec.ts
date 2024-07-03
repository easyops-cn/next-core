import { customEditors } from "./CustomEditors.js";

const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => void 0);

describe("CustomEditors", () => {
  it("should work", () => {
    function objectEntries(object: Record<string, any>): [string, any][] {
      return Object.entries(object);
    }
    function returnNumber5(): number {
      return 5;
    }
    customEditors.define("eo-button--editor", objectEntries);
    customEditors.define("basic-bricks.general-button-editor", returnNumber5);
    customEditors.define("basic.general-button", () => void 0);

    // A namespace contains multiple editor.
    expect(
      customEditors.get("eo-button--editor")?.({
        quality: "good",
      })
    ).toEqual([["quality", "good"]]);
    expect(customEditors.get("basic-bricks.general-button-editor")?.()).toBe(5);

    expect(mockConsoleError).toHaveBeenCalledTimes(0);

    // Can't register duplicated editors in the same namespace.
    customEditors.define("eo-button--editor", () => void 0);

    expect(mockConsoleError).toHaveBeenCalledTimes(1);
  });
});
