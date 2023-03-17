import { customProcessors } from "./CustomProcessors.js";

describe("CustomProcessors", () => {
  it("should work", () => {
    function objectEntries(object: Record<string, any>): [string, any][] {
      return Object.entries(object);
    }
    function returnNumber5(): number {
      return 5;
    }
    customProcessors.define("brickKit.objectEntries", objectEntries);
    customProcessors.define("brickKit.returnNumber5", returnNumber5);
    customProcessors.define("anotherPkg.objectEntries", () => void 0);

    // A namespace contains multiple processors.
    expect(
      customProcessors.get("brickKit")?.get("objectEntries")?.({
        quality: "good",
      })
    ).toEqual([["quality", "good"]]);
    expect(customProcessors.get("brickKit")?.get("returnNumber5")?.()).toBe(5);

    // Processors between namespaces are isolated.
    expect(
      customProcessors.get("anotherPkg")?.get("objectEntries")?.({
        quality: "good",
      })
    ).toBe(undefined);

    // Can't register duplicated processors in the same namespace.
    expect(() => {
      customProcessors.define("brickKit.objectEntries", () => void 0);
    }).toThrowError();
  });
});
