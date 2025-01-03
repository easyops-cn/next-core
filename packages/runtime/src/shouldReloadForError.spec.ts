import { shouldReloadForError } from "./shouldReloadForError.js";
import { BrickLoadError } from "@next-core/loader";

const mockGetItem = jest.spyOn(Storage.prototype, "getItem");
const mockSetItem = jest.spyOn(Storage.prototype, "setItem");
const mockRemoveItem = jest.spyOn(Storage.prototype, "removeItem");

describe("shouldReloadForError", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "userAgent", {
      value: "upchat",
      configurable: true,
    });
    mockGetItem.mockReturnValue(null);
  });

  it("should reload if error is a network error and count is less than MAX_RELOAD_COUNT", () => {
    const result = shouldReloadForError(new BrickLoadError("Network error"));

    expect(result).toBe(true);
    expect(mockSetItem).toHaveBeenCalledWith("reload-for-error-count", "1");
  });

  it("should not reload if count is equal to MAX_RELOAD_COUNT", () => {
    mockGetItem.mockReturnValue("2");

    const result = shouldReloadForError(new BrickLoadError("Network error"));

    expect(result).toBe(false);
    expect(mockSetItem).not.toHaveBeenCalled();
    expect(mockRemoveItem).toHaveBeenCalledWith("reload-for-error-count");
  });

  it("should not reload if userAgent does not match", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Chrome",
      configurable: true,
    });

    const result = shouldReloadForError(new BrickLoadError("Network error"));

    expect(result).toBe(false);
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it("should not reload if error is not a network error", () => {
    const result = shouldReloadForError(new Error("Other error"));

    expect(result).toBe(false);
    expect(mockSetItem).not.toHaveBeenCalled();
  });
});
