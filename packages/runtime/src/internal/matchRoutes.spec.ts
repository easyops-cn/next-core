import type { RouteConf } from "@next-core/types";
import { matchRoutes, matchRoute } from "./matchRoutes.js";

const consoleError = jest.spyOn(console, "error").mockImplementation();

describe("matchRoutes", () => {
  test("handle path not string", async () => {
    await expect(() =>
      matchRoutes(
        [{}] as any,
        {
          app: {
            homepage: "/x",
          },
          location: {
            pathname: "/x/y",
          },
        } as any
      )
    ).rejects.toMatchInlineSnapshot(
      `[Error: Invalid route with invalid type of path: undefined]`
    );
    expect(consoleError).toHaveBeenCalledWith(
      "Invalid route with invalid path:",
      {}
    );
  });
});

describe("matchRoute", () => {
  test("handle array path", () => {
    const route: RouteConf = {
      path: "${APP.homepage}[,/b/([^/]+)]",
      exact: true,
      bricks: [],
    };
    const homepage = "/home";

    expect(matchRoute(route, homepage, "/home/b/123")).toEqual({
      isExact: true,
      params: {
        "0": "123",
      },
      path: "/home/b/([^/]+)",
      url: "/home/b/123",
    });

    expect(matchRoute(route, homepage, "/home")).toEqual({
      isExact: true,
      params: {},
      path: "/home",
      url: "/home",
    });

    expect(matchRoute(route, homepage, "/home/c")).toEqual(null);
    expect(matchRoute(route, homepage, "/home/b/123/x")).toEqual(null);
  });

  test("handle not started with ${APP.homepage}", () => {
    const route: RouteConf = {
      path: "/home[,/b/([^/]+)]",
      exact: true,
      bricks: [],
    };
    const homepage = "/home";

    expect(matchRoute(route, homepage, "/home")).toEqual(null);
    expect(matchRoute(route, homepage, "/home/b/123")).toEqual(null);
  });
});
