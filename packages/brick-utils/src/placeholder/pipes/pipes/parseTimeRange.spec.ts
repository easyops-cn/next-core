import { install, InstalledClock } from "lolex";
import { parseTimeRange } from "./parseTimeRange";

describe("parseTimeRange", () => {
  let clock: InstalledClock;
  beforeEach(() => {
    clock = install({ now: +new Date("2019-05-10 17:51:00") });
  });
  afterEach(() => {
    clock.uninstall();
  });

  const testCases: [string, number][] = [
    ["", 1557481860000],
    ["1557417600000", 1557417600000],
    ["now-7d", 1556877060000],
    ["now/d", 1557417600000],
    ["now/y", 1546272000000],
  ];
  test.each(testCases)(
    "parseTimeRange(%j) should return %j",
    (input, output) => {
      expect(parseTimeRange(input)).toEqual(output);
    }
  );
});
