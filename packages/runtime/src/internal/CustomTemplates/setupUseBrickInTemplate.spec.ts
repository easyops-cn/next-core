import {
  symbolForTplStateStoreId,
  RuntimeBrickConfOfTplSymbols,
} from "./constants.js";
import { setupUseBrickInTemplate } from "./setupUseBrickInTemplate.js";

describe("setupUseBrickInTemplate", () => {
  it("should work for undefined props", () => {
    const props = undefined;
    const returnedProps = setupUseBrickInTemplate(props, {
      tplStateStoreId: "tpl-state-1",
    } as any);
    expect(returnedProps).toBe(undefined);
  });

  it("should work", () => {
    const props = {
      displayBrick: {
        useBrick: {
          brick: "my-brick-a",
          properties: {
            useBrick: {
              brick: "my-brick-b",
            },
            list: [1],
          },
          slots: {
            any: {
              bricks: [
                {
                  brick: "my-brick-c",
                  properties: {
                    useBrick: [
                      { brick: "my-brick-d" },
                      { brick: "my-brick-d" },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    };
    const returnedProps = setupUseBrickInTemplate(props, {
      tplStateStoreId: "tpl-state-1",
    } as any);

    for (const item of [
      returnedProps,
      returnedProps.displayBrick,
      returnedProps.displayBrick.useBrick.properties,
      returnedProps.displayBrick.useBrick.slots,
      returnedProps.displayBrick.useBrick.slots.any,
      returnedProps.displayBrick.useBrick.slots.any.bricks,
      returnedProps.displayBrick.useBrick.slots.any.bricks[0].properties,
      returnedProps.displayBrick.useBrick.slots.any.bricks[0].properties
        .useBrick,
    ]) {
      expect(
        (item as RuntimeBrickConfOfTplSymbols)[symbolForTplStateStoreId]
      ).toBe(undefined);
    }

    for (const item of [
      returnedProps.displayBrick.useBrick,
      returnedProps.displayBrick.useBrick.slots.any.bricks[0],
      returnedProps.displayBrick.useBrick.slots.any.bricks[0].properties
        .useBrick[0],
      returnedProps.displayBrick.useBrick.slots.any.bricks[0].properties
        .useBrick[1],
    ]) {
      expect(
        (item as RuntimeBrickConfOfTplSymbols)[symbolForTplStateStoreId]
      ).toBe("tpl-state-1");
    }
  });
});
