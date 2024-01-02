import {
  RuntimeContext,
  symbolForRootRuntimeContext,
} from "./secret_internals.js";
import { setupRootRuntimeContext } from "./setupRootRuntimeContext.js";

describe("setupRootRuntimeContext", () => {
  test("should add symbols", () => {
    const runtimeContext = {} as RuntimeContext;
    const bricks = [
      {
        brick: "span",
        slots: {
          "": {
            bricks: [
              {
                brick: "my-brick-z",
                properties: {
                  useBrick: {
                    brick: "i",
                  },
                },
              },
            ],
          },
        },
      },
      {
        brick: "my-brick-a",
        properties: {
          useBrick: [
            {
              brick: "my-brick-b",
              properties: {
                inner: {
                  useBrick: {
                    brick: "a",
                  },
                },
              },
              slots: {
                "": {
                  bricks: [
                    {
                      brick: "my-brick-c",
                      properties: {
                        list: [
                          {
                            useBrick: {
                              brick: "b",
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
                empty: {},
              },
            },
          ],
        },
      },
    ] as any;
    setupRootRuntimeContext(bricks, runtimeContext);
    expect(
      bricks[0].slots[""].bricks[0].properties.useBrick[
        symbolForRootRuntimeContext
      ]
    ).toBe(runtimeContext);
    expect(bricks[1].properties?.useBrick[0][symbolForRootRuntimeContext]).toBe(
      runtimeContext
    );
    expect(
      bricks[1].properties?.useBrick[0].properties.inner.useBrick[
        symbolForRootRuntimeContext
      ]
    ).toBe(runtimeContext);
    expect(
      bricks[1].properties?.useBrick[0].slots[""].bricks[0].properties.list[0]
        .useBrick[symbolForRootRuntimeContext]
    ).toBe(runtimeContext);
  });
});
