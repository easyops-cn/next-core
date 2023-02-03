import { describe, test, expect } from "@jest/globals";
import {
  MemberUsageInExpressions,
  collectMemberUsage,
} from "./collectMemberUsage.js";

describe("collectMemberUsage", () => {
  test.each<[string, MemberUsageInExpressions]>([
    [
      "<% CTX.abc, CTX.def.xyz %>",
      {
        usedProperties: new Set(["abc", "def"]),
        hasNonStaticUsage: false,
      },
    ],
    [
      "<% CTX['abc'], CTX.def %>",
      {
        usedProperties: new Set(["abc", "def"]),
        hasNonStaticUsage: false,
      },
    ],
    [
      "<% CTX[abc], CTX.def %>",
      {
        usedProperties: new Set(["def"]),
        hasNonStaticUsage: true,
        nonStaticUsage: "<% CTX[abc], CTX.def %>",
      },
    ],
    [
      "<% CTX.abc, CTX %>",
      {
        usedProperties: new Set(["abc"]),
        hasNonStaticUsage: true,
        nonStaticUsage: "<% CTX.abc, CTX %>",
      },
    ],
    [
      "<% CTX[abc] %>",
      {
        usedProperties: new Set(),
        hasNonStaticUsage: true,
        nonStaticUsage: "<% CTX[abc] %>",
      },
    ],
    [
      "<% CTX %>",
      {
        usedProperties: new Set(),
        hasNonStaticUsage: true,
        nonStaticUsage: "<% CTX %>",
      },
    ],
    [
      "<% STATE.abc, STATE %>",
      {
        usedProperties: new Set(),
        hasNonStaticUsage: false,
      },
    ],
  ])("collect CTX usage for '%s'", (input, output) => {
    expect(collectMemberUsage(input, "CTX")).toEqual(output);
  });

  test.each<[string, MemberUsageInExpressions]>([
    [
      "<% PROCESSORS.abc.def %>",
      {
        usedProperties: new Set(["abc.def"]),
        hasNonStaticUsage: false,
      },
    ],
    [
      "<% PROCESSORS.abc %>",
      {
        usedProperties: new Set(),
        hasNonStaticUsage: true,
        nonStaticUsage: "<% PROCESSORS.abc %>",
      },
    ],
  ])("collect PROCESSORS usage for '%s'", (input, output) => {
    expect(collectMemberUsage(input, "PROCESSORS", 2)).toEqual(output);
  });
});
