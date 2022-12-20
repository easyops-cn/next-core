import { BrickConf, ContextConf, RouteConf } from "@next-core/brick-types";
import { scanContextInStoryboard } from "./scanContextInStoryboard";

describe("scanContextInStoryboard", () => {
  it("should work", () => {
    const routes: RouteConf[] = [
      {
        alias: "a",
        path: "/a",
        type: "bricks",
        context: [
          {
            name: "context1",
            value: "1",
          },
        ],
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

    const context: ContextConf[] = [];

    scanContextInStoryboard(routes, context);

    expect(context).toEqual([
      {
        name: "context1",
        value: "1",
      },
    ]);
  });
});
