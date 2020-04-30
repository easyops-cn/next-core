import { Storyboard, BrickConf } from "@easyops/brick-types";
import {
  scanBricksInStoryboard,
  scanBricksInBrickConf,
} from "./scanBricksInStoryboard";

describe("scanBricksInStoryboard", () => {
  it("should work", () => {
    const storyboard: Storyboard = {
      meta: {
        customTemplates: [
          {
            name: "ct-a",
            bricks: [
              {
                brick: "b-x",
              },
            ],
          },
          {
            name: "ct-b",
            bricks: [
              {
                brick: "b-y",
              },
              {
                brick: "span",
              },
            ],
          },
        ],
      },
      routes: [
        {
          providers: [
            "p-a",
            {
              brick: "p-b",
            },
          ],
          bricks: [
            {
              brick: "b-a",
            },
            {
              brick: "div",
            },
            {
              brick: "b-b",
              slots: {
                s: {
                  type: "bricks",
                  bricks: [
                    {
                      brick: "b-c",
                      internalUsedBricks: ["b-e"],
                    },
                  ],
                },
                l: {
                  type: "routes",
                  // `routes` not set
                },
              },
            },
          ],
        },
        {
          menu: {
            type: "brick",
            brick: "b-d",
          },
          // `bricks` not set
        },
        {
          bricks: [
            {
              template: "t-a",
            },
          ],
        },
        {
          type: "routes",
          routes: [
            {
              bricks: [
                {
                  brick: "b-f",
                  properties: {
                    goods: [
                      {
                        useBrick: {
                          brick: "b-o",
                        },
                      },
                    ],
                    props: {
                      useBrick: [
                        {
                          brick: "b-p",
                          properties: {
                            useBrick: {
                              brick: "b-q",
                            },
                          },
                        },
                      ],
                    },
                    oops: {
                      useBrick: "b-ignored",
                    },
                    ouch: {
                      useBrick: {
                        echo: "b-ignored",
                      },
                    },
                  },
                  transform: {
                    useBrick: {
                      brick: "b-ignored",
                    },
                  },
                },
                {
                  brick: "ct-a",
                },
              ],
            },
          ],
        },
      ],
    } as any;
    expect(scanBricksInStoryboard(storyboard)).toEqual([
      "p-a",
      "p-b",
      "b-a",
      "b-b",
      "b-c",
      "b-e",
      "b-d",
      "b-f",
      "b-o",
      "b-p",
      "b-q",
      "b-x",
      "b-y",
    ]);
  });
});

describe("scanBricksInBrickConf", () => {
  it("should work", () => {
    const brickConf: BrickConf = {
      brick: "b-b",
      slots: {
        s: {
          type: "bricks",
          bricks: [
            {
              brick: "b-c",
              internalUsedBricks: ["b-e"],
            },
            {
              brick: "div",
            },
          ],
        },
        l: {
          type: "routes",
          routes: [
            {
              bricks: [
                {
                  brick: "b-f",
                },
              ],
            },
          ],
          // `routes` not set
        },
      },
    } as any;
    expect(scanBricksInBrickConf(brickConf)).toEqual([
      "b-b",
      "b-c",
      "b-e",
      "b-f",
    ]);
  });
});
