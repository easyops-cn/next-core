import {
  FormatType,
  convertValueByPrecision,
  formatValue,
} from "./valueFormatter";

describe("valueFormatter", () => {
  it("should convert value by precision correctly", () => {
    expect(convertValueByPrecision(1)).toEqual("1");
    expect(convertValueByPrecision(1, 2)).toEqual("1.00");
  });

  it("should format value correctly", () => {
    expect(formatValue(1)).toEqual(["1.00", null]);
    expect(formatValue(1, { type: FormatType.None, unit: "个" })).toEqual([
      "1.00",
      "个",
    ]);
    expect(formatValue(0.5, { type: FormatType.Percent })).toEqual([
      "50.00%",
      null,
    ]);
    expect(
      formatValue(1024, {
        type: FormatType.DataRate,
        unit: "KBps",
      })
    ).toEqual(["1.00", "MBps"]);
    expect(
      formatValue(1024, {
        unit: "KBps",
      })
    ).toEqual(["1.00", "MBps"]);
  });
});
