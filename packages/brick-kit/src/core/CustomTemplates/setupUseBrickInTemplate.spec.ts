import { deepFreeze } from "@next-core/brick-utils";
import { setupUseBrickInTemplate } from "./setupUseBrickInTemplate";
import { symbolForTplContextId } from "./constants";

describe("setupUseBrickInTemplate", () => {
  it("should work for undefined props", () => {
    const result = setupUseBrickInTemplate(undefined, {
      templateContextId: "tpl-ctx-1",
    } as any);
    expect(result).toBe(undefined);
  });

  it("should work", () => {
    const props: Record<string | symbol, any> = {
      displayBrick: {
        useBrick: {
          brick: "my-brick-a",
          properties: {
            useBrick: {
              brick: "my-brick-b",
            },
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
    deepFreeze(props);
    const result = setupUseBrickInTemplate(props, {
      templateContextId: "tpl-ctx-1",
    } as any);

    for (const item of [
      result,
      result.displayBrick,
      result.displayBrick.useBrick.properties,
      result.displayBrick.useBrick.slots,
      result.displayBrick.useBrick.slots.any,
      result.displayBrick.useBrick.slots.any.bricks,
      result.displayBrick.useBrick.slots.any.bricks[0].properties,
      result.displayBrick.useBrick.slots.any.bricks[0].properties.useBrick,
    ]) {
      expect(item[symbolForTplContextId]).toBe(undefined);
    }

    for (const item of [
      result.displayBrick.useBrick,
      result.displayBrick.useBrick.slots.any.bricks[0],
      result.displayBrick.useBrick.slots.any.bricks[0].properties.useBrick[0],
      result.displayBrick.useBrick.slots.any.bricks[0].properties.useBrick[1],
    ]) {
      expect(item[symbolForTplContextId]).toBe("tpl-ctx-1");
    }
  });
});
