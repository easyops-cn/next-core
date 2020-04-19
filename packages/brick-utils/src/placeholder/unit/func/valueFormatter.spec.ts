import {
  FormatType,
  convertValueByPrecision,
  formatValue,
  Format,
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
    expect(
      formatValue(100.0, {
        type: FormatType.Short,
      })
    ).toEqual(["100.00", undefined]);
  });

  it.each([
    [
      24,
      {
        type: "time",
        precision: 0,
      },
      ["24", "ms"],
    ],
    [
      24,
      {
        unit: "hours",
        precision: 0,
      },
      ["1", "day"],
    ],
    [
      24,
      {
        unit: "hours",
        precision: 1,
      },
      ["1.0", "day"],
    ],
  ])("time format", (value, format, res) => {
    expect(formatValue(value, format as Format)).toEqual(res);
  });

  it.each([
    [
      1024,
      {
        unit: "bytes",
        precision: 0,
      },
      ["1", "KB"],
    ],
    [
      1024,
      {
        unit: "bytes(B)",
        precision: 0,
      },
      ["128", "B"],
    ],
  ])("Data format", (value, format, res) => {
    expect(formatValue(value, format)).toEqual(res);
  });

  it.each([
    [
      10,
      {
        unit: "percent(100)",
        precision: 0,
      },
      ["10%", null],
    ],
    [
      0.1,
      {
        unit: "percent(1)",
        precision: 0,
      },
      ["10%", null],
    ],
  ])("percent format", (value, format, res) => {
    expect(formatValue(value, format)).toEqual(res);
  });

  it.each([
    [
      1000,
      {
        unit: "K",
        precision: 0,
      },
      ["1M", "K"],
    ],
    // [0.1, K
    //   unit: 'percent(1)',
    //   precision: 0
    // }, ["10%", null]],
  ])("number format", (value, format, res) => {
    expect(formatValue(value, format)).toEqual(res);
  });
});
