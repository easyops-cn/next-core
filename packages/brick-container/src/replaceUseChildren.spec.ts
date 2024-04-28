import type { BrickConf } from "@next-core/brick-types";
import { replaceUseChildren } from "./replaceUseChildren";

describe("replaceUseChildren", () => {
  test("should work", () => {
    const bricks: BrickConf[] = [
      {
        brick: "brick-a",
        slots: {
          "": {
            type: "bricks",
            bricks: [
              {
                brick: "brick-b",
                properties: {
                  useChildren: "[cell]",
                  inner: {
                    useChildren: "[inner]",
                  },
                  missed: {
                    useChildren: "[missed]",
                  },
                },
                slots: {
                  "[cell]": {
                    type: "bricks",
                    bricks: [
                      {
                        brick: "brick-c",
                      },
                      {
                        brick: "brick-d",
                      },
                    ],
                  },
                  "[inner]": {
                    type: "bricks",
                    bricks: [
                      {
                        brick: "brick-e",
                      },
                    ],
                  },
                  normal: {
                    type: "bricks",
                    bricks: [
                      {
                        brick: "brick-d",
                      },
                    ],
                  },
                  "[unknown]": {
                    type: "bricks",
                    bricks: [
                      {
                        brick: "brick-z",
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    ];

    replaceUseChildren(bricks);

    expect(bricks).toEqual([
      {
        brick: "brick-a",
        slots: {
          "": {
            type: "bricks",
            bricks: [
              {
                brick: "brick-b",
                properties: {
                  useBrick: [
                    {
                      brick: "brick-c",
                    },
                    {
                      brick: "brick-d",
                    },
                  ],
                  inner: {
                    useBrick: {
                      brick: "brick-e",
                    },
                  },
                  missed: {
                    useChildren: "[missed]",
                  },
                },
                slots: {
                  normal: {
                    type: "bricks",
                    bricks: [
                      {
                        brick: "brick-d",
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    ]);
  });
});
