import { getSpanId } from "./utils";

describe("utils", () => {
  it("getSpanId should work", () => {
    expect(getSpanId()).toHaveLength(16);
  });
});
