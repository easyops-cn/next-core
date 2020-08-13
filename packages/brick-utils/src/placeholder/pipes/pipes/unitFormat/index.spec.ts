import { unitFormat } from "./index";

describe("unitFormat", () => {
  const testCases: [
    Parameters<typeof unitFormat>,
    ReturnType<typeof unitFormat>
  ][] = [
    [
      [1024.0, "KBps"],
      ["1.00", "MBps"],
    ],
    [
      [1024.0, "KBps", 3],
      ["1.000", "MBps"],
    ],
  ];
  test.each(testCases)(
    "unitFormat(...%j) should return %j",
    (input, output) => {
      expect(unitFormat(...input)).toEqual(output);
    }
  );
});
