import { BrickConf, RouteConf } from "@next-core/brick-types";
import { scanCompleteBricksInStoryboard } from "./scanCompleteBricksInStoryboard";

describe("scanCompleteBricksInStoryboard", () => {
  it("should work", () => {
    const routes: RouteConf[] = [
      {
        alias: "a",
        path: "/a",
        type: "bricks",
        bricks: [
          {
            brick: "test",
          },
          {
            brick: "test",
            slots: {
              s: {
                type: "bricks",
                bricks: [],
              },
              l: {
                type: "routes",
                routes: [
                  {
                    alias: "a.b",
                    path: "/a/b",
                  },
                  {
                    path: "/a/c",
                  },
                ],
              },
            },
          },
        ],
      },
      {
        type: "routes",
        alias: "r",
        path: "/r",
        routes: [
          {
            alias: "x",
            path: "/x",
            type: "bricks",
          },
        ],
      },
    ];

    const completeBricks: BrickConf[] = [];

    scanCompleteBricksInStoryboard(routes, completeBricks);

    expect(completeBricks).toEqual([
      {
        brick: "test",
      },
      {
        brick: "test",
        slots: {
          s: {
            type: "bricks",
            bricks: [],
          },
          l: {
            type: "routes",
            routes: [
              {
                alias: "a.b",
                path: "/a/b",
              },
              {
                path: "/a/c",
              },
            ],
          },
        },
      },
    ]);
  });
});
