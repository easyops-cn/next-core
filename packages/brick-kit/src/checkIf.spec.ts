import { PluginRuntimeContext } from "@easyops/brick-types";
import {
  checkIf,
  checkIfByTransform,
  IfContainer,
  looseCheckIf,
  looseCheckIfByTransform,
  looseCheckIfOfComputed,
} from "./checkIf";

jest.spyOn(console, "warn").mockImplementation(() => void 0);

describe("looseCheckIf", () => {
  it.each<[IfContainer, Record<string, unknown>, boolean]>([
    [{}, {}, true],
    [{ if: false }, {}, false],
    [{ if: true }, {}, true],
    [{ if: null }, {}, false],
    [{ if: "" }, {}, false],
    [
      { if: "${FLAGS.enabled}" },
      {
        flags: {},
      },
      false,
    ],
    [
      { if: "${FLAGS.enabled}" },
      {
        flags: { enabled: true },
      },
      true,
    ],
  ])("looseCheckIf(%j, %j) should return %j", (ifContainer, ctx, result) => {
    expect(
      looseCheckIf(ifContainer, (ctx as unknown) as PluginRuntimeContext)
    ).toBe(result);
  });

  it("looseCheckIfByTransform should work", () => {
    expect(looseCheckIfByTransform({ if: "@{enabled}" }, {})).toBe(false);
    expect(
      looseCheckIfByTransform({ if: "@{enabled}" }, { enabled: true })
    ).toBe(true);
  });

  it("looseCheckIfOfComputed should work", () => {
    expect(looseCheckIfOfComputed({})).toBe(true);
    expect(looseCheckIfOfComputed({ if: null })).toBe(false);
    expect(looseCheckIfOfComputed({ if: 0 })).toBe(false);
    expect(looseCheckIfOfComputed({ if: 1 })).toBe(true);
  });
});

describe("checkIf", () => {
  it.each<[string | boolean, Record<string, unknown>, boolean]>([
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
    expect(checkIf(rawIf, (ctx as unknown) as PluginRuntimeContext)).toBe(
      result
    );
  });

  it("checkIfByTransform should work", () => {
    expect(checkIfByTransform("@{enabled}", { enabled: true })).toBe(true);
    expect(checkIfByTransform("@{enabled|not}", { enabled: true })).toBe(false);
  });
});
