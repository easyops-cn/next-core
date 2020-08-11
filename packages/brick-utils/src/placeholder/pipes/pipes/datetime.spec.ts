import { datetime } from "./datetime";

describe("datetime", () => {
  const testCases: [number | string, string, string][] = [
    [1582877669000, "YYYY-MM-DD", "2020-02-28"],
    ["2020/02/28 17:14", "YYYY-MM-DD", "2020-02-28"],
  ];
  test.each(testCases)(
    "datetime(%j, %j) should return %j",
    (value, format, output) => {
      expect(datetime(value, format)).toEqual(output);
    }
  );
});
