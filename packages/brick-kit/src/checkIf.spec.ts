import { checkIf, checkIfByTransform } from "./checkIf";

jest.spyOn(console, "warn").mockImplementation(() => void 0);

describe("checkIf", () => {
  it.each<[string | boolean, any, boolean]>([
    [undefined, {}, true],
    [false, {}, false],
    [true, {}, true],
    [{} as any, {}, true],
    [
      "${FLAGS.enabled}",
      {
        flags: {
          enabled: true,
        },
      },
      true,
    ],
    [
      "${FLAGS.enabled|not}",
      {
        flags: {
          enabled: true,
        },
      },
      false,
    ],
  ])("checkIf(%j, %j) should return %j", (rawIf, ctx, result) => {
    expect(checkIf(rawIf, ctx)).toBe(result);
  });

  it("checkIfByTransform should work", () => {
    expect(checkIfByTransform("@{enabled}", { enabled: true })).toBe(true);
    expect(checkIfByTransform("@{enabled|not}", { enabled: true })).toBe(false);
  });
});
