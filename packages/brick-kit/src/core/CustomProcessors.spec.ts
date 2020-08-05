import {
  registerCustomProcessor,
  customProcessorRegistry,
} from "./CustomProcessors";

describe("CustomProcessors", () => {
  it("should work", () => {
    function objectEntries(object: Record<string, any>): [string, any][] {
      return Object.entries(object);
    }
    registerCustomProcessor("objectEntries", objectEntries);
    expect(
      customProcessorRegistry.get("objectEntries")({ quality: "good" })
    ).toEqual([["quality", "good"]]);

    expect(() => {
      registerCustomProcessor("objectEntries", () => void 0);
    }).toThrowError();
  });
});
