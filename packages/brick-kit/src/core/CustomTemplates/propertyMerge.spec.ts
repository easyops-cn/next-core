import { BrickConfInTemplate } from "@easyops/brick-types";
import { MergeablePropertyProxy } from "./internalInterfaces";
import { propertyMerge, propertyMergeAll } from "./propertyMerge";
import { collectMergeBases } from "./collectMergeBases";

describe("propertyMerge", () => {
  let proxyProperties: Record<string, MergeablePropertyProxy>;

  beforeEach(() => {
    proxyProperties = {
      prependColumns: {
        ref: "table",
        mergeProperty: "columns",
        mergeType: "array",
        mergeMethod: "prepend",
      },
      firstIntermediateColumns: {
        ref: "table",
        mergeProperty: "columns",
        mergeType: "array",
        mergeMethod: "insertAt",
        mergeArgs: [1],
      },
      lastIntermediateColumns: {
        ref: "table",
        mergeProperty: "columns",
        mergeType: "array",
        mergeMethod: "insertAt",
        mergeArgs: [-2],
      },
      appendColumns: {
        ref: "table",
        mergeProperty: "columns",
        mergeType: "array",
        mergeMethod: "append",
      },
      extendFilters: {
        ref: "table",
        mergeProperty: "filters",
        mergeType: "object",
        mergeMethod: "extend",
      },
    };
    const mergeBases = new Map();
    const refToBrickMap = new Map<string, BrickConfInTemplate>([
      [
        "table",
        {
          brick: "a",
          properties: {
            columns: [2, 3, 4],
            filters: {
              id: true,
            },
          },
        },
      ],
    ]);
    const context = {} as any;

    for (const [reveredRef, proxy] of Object.entries(proxyProperties)) {
      proxy.$$reversedRef = reveredRef;
    }

    for (const proxy of Object.values(proxyProperties)) {
      collectMergeBases(proxy, mergeBases, context, refToBrickMap);
    }
  });

  it("should work for merging array", () => {
    const finalValue = propertyMerge(proxyProperties.prependColumns, [0, 1], {
      firstIntermediateColumns: [2.5],
      lastIntermediateColumns: [3.5],
      appendColumns: [10],
    });
    expect(finalValue).toEqual([0, 1, 2, 2.5, 3, 3.5, 4, 10]);
  });

  it("should work for merging object", () => {
    const finalValue = propertyMerge(
      proxyProperties.extendFilters,
      {
        name: true,
      },
      {}
    );
    expect(finalValue).toEqual({
      id: true,
      name: true,
    });
  });

  it("should work for merging all of array", () => {
    const finalValue = propertyMergeAll(
      proxyProperties.prependColumns.$$mergeBase,
      {
        prependColumns: [0, 1],
        firstIntermediateColumns: [2.5],
        lastIntermediateColumns: [3.5],
        appendColumns: [10],
      }
    );
    expect(finalValue).toEqual([0, 1, 2, 2.5, 3, 3.5, 4, 10]);
  });

  it("should work for merging all of object", () => {
    const finalValue = propertyMergeAll(
      proxyProperties.extendFilters.$$mergeBase,
      {
        extendFilters: {
          name: true,
        },
      }
    );
    expect(finalValue).toEqual({
      id: true,
      name: true,
    });
  });
});
