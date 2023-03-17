import {
  matchPath,
  MatchPathOptions,
  MatchResult,
  toPath,
} from "./matchPath.js";

describe("matchPath", () => {
  it.each<[string, MatchPathOptions, Partial<MatchResult> | null]>([
    [
      "/",
      {
        path: "/",
      },
      {
        path: "/",
        url: "/",
        isExact: true,
        params: {},
      },
    ],
    [
      "/next",
      {
        path: "/:id",
        exact: true,
      },
      {
        path: "/:id",
        url: "/next",
        isExact: true,
        params: {
          id: "next",
        },
      },
    ],
    [
      "/next",
      {
        path: ["/:id", "/before"],
        exact: true,
      },
      {
        path: "/:id",
        url: "/next",
        isExact: true,
        params: {
          id: "next",
        },
      },
    ],
    [
      "/next",
      {
        path: "/",
        exact: true,
      },
      null,
    ],
    [
      "/next",
      {
        path: ["/"],
        exact: true,
      },
      null,
    ],
    [
      "/next",
      {
        path: [],
      },
      null,
    ],
  ])("matchPath('%s', %j) should return %j", (pathname, options, result) => {
    expect(matchPath(pathname, options)).toEqual(result);
  });
});

describe("toPath", () => {
  it.each<[string, Record<string, unknown> | undefined, string]>([
    ["/good", undefined, "/good"],
    [
      "/for/:quality",
      {
        quality: "good",
      },
      "/for/good",
    ],
  ])("toPath('%s', %j) should return '%s'", (path, pathParams, result) => {
    expect(toPath(path, pathParams)).toEqual(result);
  });
});
