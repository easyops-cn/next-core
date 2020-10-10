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
          defineResolves: [
            {
              useProvider: "u-q",
            },
          ],
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
              if: {
                useProvider: "u-k",
              },
              context: [
                {
                  resolve: {
                    useProvider: "u-o",
                  },
                },
              ],
              lifeCycle: {
                useResolves: [
                  {
                    provider: "u-z",
                  },
                  {
                    useProvider: "u-a",
                  },
                  {
                    useProvider: "namespace@customApi",
                  },
                ],
                onPageLoad: {
                  useProvider: "u-b",
                },
                onPageLeave: {
                  useProvider: "u-r",
                },
                onAnchorLoad: {
                  useProvider: "u-c",
                },
                onAnchorUnload: [
                  {
                    useProvider: "u-d",
                  },
                ],
                onMessage: [
                  {
                    channel: {
                      system: "m1",
                      topic: "m2",
                    },
                    handlers: {
                      useProvider: "u-s",
                    },
                  },
                ],
                onMessageClose: [{ useProvider: "u-y" }],
              },
              events: {
                click: {
                  useProvider: "u-e",
                  callback: {
                    success: {
                      useProvider: "u-f",
                    },
                    error: {
                      useProvider: "u-g",
                    },
                    finally: [
                      {
                        useProvider: "u-h",
                      },
                    ],
                  },
                },
              },
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
          menu: {
            type: "resolve",
            resolve: {
              useProvider: "u-l",
            },
          },
          redirect: {
            useProvider: "u-m",
          },
          context: [
            {
              resolve: {
                useProvider: "u-n",
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
                          events: {
                            click: {
                              useProvider: "u-i",
                              callback: {
                                success: {
                                  useProvider: "u-j",
                                },
                              },
                            },
                            mouseenter: [
                              {
                                target: "any",
                                method: "any",
                                callback: {
                                  error: [
                                    {
                                      useProvider: "u-p",
                                    },
                                  ],
                                },
                              },
                            ],
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
    expect(scanBricksInStoryboard(storyboard).sort()).toEqual([
      "b-a",
      "b-b",
      "b-c",
      "b-d",
      "b-e",
      "b-f",
      "b-o",
      "b-p",
      "b-q",
      "b-x",
      "b-y",
      "p-a",
      "p-b",
      "u-a",
      "u-b",
      "u-c",
      "u-d",
      "u-e",
      "u-f",
      "u-g",
      "u-h",
      "u-i",
      "u-j",
      "u-k",
      "u-l",
      "u-m",
      "u-n",
      "u-o",
      "u-p",
      "u-q",
      "u-r",
      "u-s",
      "u-y",
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
                  lifeCycle: {
                    useResolves: [
                      {
                        useProvider: "b-g",
                      },
                      {
                        useProvider: "namespace-a@customApi",
                      },
                    ],
                  },
                },
              ],
            },
          ],
          // `routes` not set
        },
      },
    } as any;
    expect(scanBricksInBrickConf(brickConf).sort()).toEqual([
      "b-b",
      "b-c",
      "b-e",
      "b-f",
      "b-g",
    ]);
  });
});
