import { install, InstalledClock } from "lolex";
import { deltaTime } from "./deltaTime";

describe("deltaTime", () => {
  let clock: InstalledClock;
  beforeEach(() => {
    clock = install({ now: +new Date("2019-05-10 17:51:00") });
  });
  afterEach(() => {
    clock.uninstall();
  });

  const testCases: [
    Parameters<typeof deltaTime>,
    ReturnType<typeof deltaTime>
  ][] = [
    [["2019-05-10 17:21:00"], "30 minutes ago"],
    [["2019-05-10 18:51:00"], "in an hour"],
    [[""], ""],
    [[{ startTime: "2019-05-10", endTime: "2019-06-10" }, false], "a month"],
    [[{ startTime: "2019-05-10 17:48" }, false], "3 minutes"],
    [[{ endTime: 1557482040000 }, false], "3 minutes"],
  ];
  test.each(testCases)("deltaTime(...%j) should return %j", (input, output) => {
    expect(deltaTime(...input)).toEqual(output);
  });
});
