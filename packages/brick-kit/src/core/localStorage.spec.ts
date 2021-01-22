import { getItem } from "./localStorage";

jest
  .spyOn(Storage.prototype, "getItem")
  .mockImplementation((name) => '{"id":"mockId"}');

describe("storage", () => {
  it("getItem should work", () => {
    const value = getItem("visit-history");
    expect(localStorage.getItem).toBeCalledWith("visit-history");
    expect(value).toEqual({ id: "mockId" });
  });
});
