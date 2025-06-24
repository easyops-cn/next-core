import { describe, test, jest } from "@jest/globals";
import { getStorageItem } from "./getStorageItem.js";

jest
  .spyOn(Storage.prototype, "getItem")
  .mockImplementation(() => '{"id":"mockId"}');

describe("storage", () => {
  test("localStorage.getItem should work", () => {
    const getItem = getStorageItem("local");
    const value = getItem("visit-history");
    expect(localStorage.getItem).toHaveBeenCalledWith("visit-history");
    expect(value).toEqual({ id: "mockId" });
  });

  test("sessionStorage.getItem should work", () => {
    const getItem = getStorageItem("session");
    const value = getItem("visit-history");
    expect(localStorage.getItem).toHaveBeenCalledWith("visit-history");
    expect(value).toEqual({ id: "mockId" });
  });
});
