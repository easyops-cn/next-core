import { getSpanId } from "./utils.js";

describe("utils", () => {
  it("getSpanId should work", () => {
    expect(getSpanId()).toHaveLength(16);
  });
});
