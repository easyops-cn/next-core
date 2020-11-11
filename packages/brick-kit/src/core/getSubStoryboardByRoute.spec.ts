import { Storyboard } from "@easyops/brick-types";
import {
  getSubStoryboardByRoute,
  SubStoryboardMatcher,
} from "./getSubStoryboardByRoute";

describe("getSubStoryboardByRoute", () => {
  const storyboard: Partial<Storyboard> = {
    routes: [
      {
        path: "/1",
        bricks: [
          {
            brick: "b-a",
            slots: {
              toolbar: {
                type: "bricks",
                bricks: [
                  {
                    brick: "b-b",
                  },
                ],
              },
              content: {
                type: "routes",
                routes: [
                  {
                    path: "/1/2",
                    bricks: [
                      {
                        brick: "b-c",
                      },
                    ],
                  },
                  {
                    path: "/1/3",
                    type: "routes",
                    routes: [
                      {
                        path: "/1/3/9",
                        bricks: null,
                      },
                    ],
                  },
                  {
                    path: "/1/0",
                    redirect: "/0",
                  },
                ],
              },
            },
          },
        ],
      },
      {
        path: "/4",
        bricks: [
          {
            brick: "b-e",
          },
        ],
      },
    ],
  };

  const matcherFactory = (url: string): SubStoryboardMatcher => (routes) => {
    return routes.filter((route) => url.startsWith(route.path));
  };

  it.each<[string, Partial<Storyboard>]>([
    [
      "/1",
      {
        routes: [
          {
            path: "/1",
            bricks: [
              {
                brick: "b-a",
                slots: {
                  toolbar: {
                    type: "bricks",
                    bricks: [
                      {
                        brick: "b-b",
                      },
                    ],
                  },
                  content: {
                    type: "routes",
                    routes: [],
                  },
                },
              },
            ],
          },
        ],
      },
    ],
    [
      "/1/2",
      {
        routes: [
          {
            path: "/1",
            bricks: [
              {
                brick: "b-a",
                slots: {
                  toolbar: {
                    type: "bricks",
                    bricks: [
                      {
                        brick: "b-b",
                      },
                    ],
                  },
                  content: {
                    type: "routes",
                    routes: [
                      {
                        path: "/1/2",
                        bricks: [
                          {
                            brick: "b-c",
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
      },
    ],
    [
      "/1/3/9",
      {
        routes: [
          {
            path: "/1",
            bricks: [
              {
                brick: "b-a",
                slots: {
                  toolbar: {
                    type: "bricks",
                    bricks: [
                      {
                        brick: "b-b",
                      },
                    ],
                  },
                  content: {
                    type: "routes",
                    routes: [
                      {
                        path: "/1/3",
                        type: "routes",
                        routes: [
                          {
                            path: "/1/3/9",
                            bricks: null,
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
      },
    ],
    [
      "/4",
      {
        routes: [
          {
            path: "/4",
            bricks: [
              {
                brick: "b-e",
              },
            ],
          },
        ],
      },
    ],
  ])("getSubStoryboardByRoute(..., '%s') should work", (root, result) => {
    expect(
      getSubStoryboardByRoute(storyboard as Storyboard, matcherFactory(root))
    ).toEqual(result);
  });
});
