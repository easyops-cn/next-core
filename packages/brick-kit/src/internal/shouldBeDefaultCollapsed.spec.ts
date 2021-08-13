import { shouldBeDefaultCollapsed } from "./shouldBeDefaultCollapsed";

const mockClientWidth = jest.spyOn(
  document.documentElement,
  "clientWidth",
  "get"
);

describe("shouldBeDefaultCollapsed", () => {
  it.each<[boolean, number, number, boolean]>([
    [true, null, 0, true],
    [false, null, 0, false],
    [false, 1600, 1920, false],
    [false, 1600, 1280, true],
  ])(
    "should work",
    (defaultCollapsed, defaultCollapsedBreakpoint, clientWidth, result) => {
      mockClientWidth.mockReturnValue(clientWidth);
      expect(
        !!shouldBeDefaultCollapsed(defaultCollapsed, defaultCollapsedBreakpoint)
      ).toBe(result);
    }
  );
});
