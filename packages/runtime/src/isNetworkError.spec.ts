import { HttpFetchError } from "@next-core/http";
import { BrickLoadError } from "@next-core/loader";
import { isNetworkError } from "./isNetworkError.js";

describe("isNetworkError", () => {
  it("should return true for BrickLoadError", () => {
    const error = new BrickLoadError("Brick load error");
    expect(isNetworkError(error)).toBe(true);
  });

  it("should return true for HttpFetchError", () => {
    const error = new HttpFetchError("Http fetch error");
    expect(isNetworkError(error)).toBe(true);
  });

  it("should return true for ChunkLoadError", () => {
    const error = new Error("Chunk load error");
    error.name = "ChunkLoadError";
    expect(isNetworkError(error)).toBe(true);
  });

  it("should return true for Event with error type and HTMLScriptElement target", () => {
    const scriptElement = document.createElement("script");
    const event = new Event("error");
    Object.defineProperty(event, "target", { value: scriptElement });
    expect(isNetworkError(event)).toBe(true);
  });

  it("should return false for other errors", () => {
    const error = new Error("Some other error");
    expect(isNetworkError(error)).toBe(false);
  });

  it("should return false for null or undefined", () => {
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });

  it("should return false for non-error objects", () => {
    const error = { message: "Not an error instance" };
    expect(isNetworkError(error)).toBe(false);
  });
});
