import { sort } from "./sort";

describe("sort", () => {
  const testCases: [Parameters<typeof sort>, ReturnType<typeof sort>][] = [
    [[null], []],
    [
      [[{ user: "c" }, { user: "b" }], "user"],
      [{ user: "b" }, { user: "c" }],
    ],
  ];
  test.each(testCases)("sort(...%j) should return %j", (input, output) => {
    expect(sort(...input)).toEqual(output);
  });
});
