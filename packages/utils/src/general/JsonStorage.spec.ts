import { describe, it, expect } from "@jest/globals";
import { JsonStorage } from "./JsonStorage.js";

describe("JsonStorage", () => {
  it("should work", () => {
    const key = "somekey";
    const storage = new JsonStorage<{ [key]: { for: string } }>(localStorage);
    expect(storage.getItem(key)).toBe(null);
    storage.setItem(key, { for: "good" });
    expect(storage.getItem(key)).toMatchObject({ for: "good" });
    storage.removeItem(key);
    expect(storage.getItem(key)).toBe(null);
    storage.setItem(key, { for: "better" });
    expect(storage.getItem(key)).toMatchObject({ for: "better" });
    storage.clear();
    expect(storage.getItem(key)).toBe(null);
  });
});
