import { getItemFactory } from "./Storage";

jest
  .spyOn(Storage.prototype, "getItem")
  .mockImplementation((name) => '{"id":"mockId"}');

describe("storage", () => {
  it("localStorage.getItem should work", () => {
    const getItem = getItemFactory("local");
    const value = getItem("visit-history");
    expect(localStorage.getItem).toBeCalledWith("visit-history");
    expect(value).toEqual({ id: "mockId" });
  });

  it("sessionStorage.getItem should work", () => {
    const getItem = getItemFactory("session");
    const value = getItem("visit-history");
    expect(localStorage.getItem).toBeCalledWith("visit-history");
    expect(value).toEqual({ id: "mockId" });
  });
});
