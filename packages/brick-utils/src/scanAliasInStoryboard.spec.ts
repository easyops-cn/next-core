import { Storyboard } from "@easyops/brick-types";
import { scanRouteAliasInStoryboard } from "./scanAliasInStoryboard";

describe("scanRouteAliasInStoryboard", () => {
  it("should work", () => {
    const storyboard: Storyboard = {
      routes: [
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
      ],
    } as any;
    expect(
      Array.from(scanRouteAliasInStoryboard(storyboard).entries())
    ).toEqual([
      [
        "a",
        {
          alias: "a",
          path: "/a",
        },
      ],
      [
        "a.b",
        {
          alias: "a.b",
          path: "/a/b",
        },
      ],
      [
        "r",
        {
          alias: "r",
          path: "/r",
        },
      ],
      [
        "x",
        {
          alias: "x",
          path: "/x",
        },
      ],
    ]);
  });
});
