import { ternary } from "./ternary";

describe("ternary", () => {
  const testCases: [
    Parameters<typeof ternary>,
    ReturnType<typeof ternary>
  ][] = [
    [[true, { a: 1 }, { b: 2 }], { a: 1 }],
    [[false, "foo", "bar"], "bar"],
  ];
  test.each(testCases)("ternary(...%j) should return %j", (input, output) => {
    expect(ternary(...input)).toEqual(output);
  });
});
