import {
  registerCustomProcessor,
  customProcessorRegistry,
} from "./CustomProcessors";

describe("CustomProcessors", () => {
  it("should work", () => {
    function objectEntries(object: Record<string, any>): [string, any][] {
      return Object.entries(object);
    }
    function returnNumber5(): number {
      return 5;
    }
    registerCustomProcessor("brickKit.objectEntries", objectEntries);
    registerCustomProcessor("brickKit.returnNumber5", returnNumber5);
    registerCustomProcessor("anotherPkg.objectEntries", () => void 0);

    // A namespace contains multiple processors.
    expect(
      customProcessorRegistry.get("brickKit").get("objectEntries")({
        quality: "good",
      })
    ).toEqual([["quality", "good"]]);
    expect(customProcessorRegistry.get("brickKit").get("returnNumber5")()).toBe(
      5
    );

    // Processors between namespaces are isolated.
    expect(
      customProcessorRegistry.get("anotherPkg").get("objectEntries")({
        quality: "good",
      })
    ).toBe(undefined);

    // Can't register duplicated processors in the same namespace.
    expect(() => {
      registerCustomProcessor("brickKit.objectEntries", () => void 0);
    }).toThrowError();
  });
});
