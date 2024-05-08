import { describe, test, expect } from "@jest/globals";
import type { BrickConf } from "@next-core/types";
import { replaceUseChildren } from "./replaceUseChildren.js";

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
                  empty: {
                    type: "routes",
                    routes: [],
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
                  empty: {
                    type: "routes",
                    routes: [],
                  },
                },
              },
            ],
          },
        },
      },
    ]);
  });

  test("should work with children", () => {
    const bricks: BrickConf[] = [
      {
        brick: "brick-a",
        properties: {
          useChildren: "[cell]",
          missed: {
            useChildren: "[missed]",
          },
        },
        children: [
          {
            brick: "brick-b",
            slot: "[cell]",
            children: [
              {
                brick: "brick-c",
                properties: {
                  inner: {
                    useChildren: "[inner]",
                  },
                },
                children: [
                  {
                    brick: "brick-d",
                    slot: "[inner]",
                  },
                  {
                    brick: "brick-e",
                    slot: "[inner]",
                  },
                  {
                    brick: "brick-f",
                  },
                ],
              },
              {
                brick: "brick-o",
              },
            ],
          },
          {
            brick: "brick-z",
            slot: "missed",
            properties: {
              x: [
                {
                  useChildren: "[x]",
                },
              ],
              y: "z",
            },
            children: [
              {
                brick: "brick-y",
              },
              {
                brick: "brick-x",
                slot: "[x]",
              },
            ],
          },
        ],
      },
    ];

    replaceUseChildren(bricks);

    expect(bricks).toEqual([
      {
        brick: "brick-a",
        children: [
          {
            brick: "brick-z",
            children: [
              {
                brick: "brick-y",
              },
            ],
            properties: {
              x: [
                {
                  useBrick: {
                    brick: "brick-x",
                  },
                },
              ],
              y: "z",
            },
            slot: "missed",
          },
        ],
        properties: {
          missed: {
            useChildren: "[missed]",
          },
          useBrick: {
            brick: "brick-b",
            children: [
              {
                brick: "brick-c",
                children: [
                  {
                    brick: "brick-f",
                  },
                ],
                properties: {
                  inner: {
                    useBrick: [
                      {
                        brick: "brick-d",
                      },
                      {
                        brick: "brick-e",
                      },
                    ],
                  },
                },
              },
              {
                brick: "brick-o",
              },
            ],
          },
        },
      },
    ]);
  });
});
