import { $camelProcessorName$ } from "./$camelProcessorName$";

jest.mock("@easyops/brick-kit", () => ({
  getRuntime: () => ({
    registerCustomProcessor: jest.fn(),
  }),
}));

describe("$camelProcessorName$", () => {
  it("should work", () => {
    expect($camelProcessorName$()).toEqual(undefined);
  });
});
