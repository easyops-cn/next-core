import { setupUseBrickInTemplate } from "./setupUseBrickInTemplate";
import { symbolForTplContextId } from "./constants";

describe("setupUseBrickInTemplate", () => {
  it("should work for undefined props", () => {
    setupUseBrickInTemplate(undefined, {
      templateContextId: "tpl-ctx-1",
    } as any);
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
    setupUseBrickInTemplate(props, {
      templateContextId: "tpl-ctx-1",
    } as any);

    for (const item of [
      props,
      props.displayBrick,
      props.displayBrick.useBrick.properties,
      props.displayBrick.useBrick.slots,
      props.displayBrick.useBrick.slots.any,
      props.displayBrick.useBrick.slots.any.bricks,
      props.displayBrick.useBrick.slots.any.bricks[0].properties,
      props.displayBrick.useBrick.slots.any.bricks[0].properties.useBrick,
    ]) {
      expect(item[symbolForTplContextId]).toBe(undefined);
    }

    for (const item of [
      props.displayBrick.useBrick,
      props.displayBrick.useBrick.slots.any.bricks[0],
      props.displayBrick.useBrick.slots.any.bricks[0].properties.useBrick[0],
      props.displayBrick.useBrick.slots.any.bricks[0].properties.useBrick[1],
    ]) {
      expect(item[symbolForTplContextId]).toBe("tpl-ctx-1");
    }
  });
});
