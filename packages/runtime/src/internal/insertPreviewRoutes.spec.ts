import { describe, test, expect } from "@jest/globals";
import type { RouteConf } from "@next-core/types";
import { insertPreviewRoutes } from "./insertPreviewRoutes.js";

const routes = [
  {
    path: "${APP.homepage}/home",
  },
  {
    path: "${APP.homepage}/_dev_only_/template-preview/test",
  },
  {
    path: "${APP.homepage}/test1",
  },
  {
    path: "${APP.homepage}/test2",
  },
  {
    path: "${APP.homepage}/_dev_only_/snippet-preview/test",
  },
] as RouteConf[];

describe("insertPreviewRoutes", () => {
  test("in iframe", () => {
    delete (window as any).parent;
    (window as any).parent = {};
    const result = insertPreviewRoutes(routes);
    expect(result).toEqual([
      {
        path: "${APP.homepage}/home",
      },
      {
        path: "${APP.homepage}/_dev_only_/template-preview/test",
      },
      {
        bricks: [
          {
            brick: "span",
          },
        ],
        exact: true,
        menu: false,
        path: "${APP.homepage}/_dev_only_/template-preview/:templateId",
      },
      {
        path: "${APP.homepage}/test1",
      },
      {
        path: "${APP.homepage}/test2",
      },
      {
        path: "${APP.homepage}/_dev_only_/snippet-preview/test",
      },
      {
        bricks: [
          {
            brick: "span",
          },
        ],
        exact: true,
        menu: false,
        path: "${APP.homepage}/_dev_only_/snippet-preview/:snippetId",
      },
    ]);
  });

  test("not in iframe", () => {
    delete (window as any).parent;
    (window as any).parent = window;
    const result = insertPreviewRoutes(routes);
    expect(result).toEqual([
      {
        path: "${APP.homepage}/home",
      },
      {
        path: "${APP.homepage}/_dev_only_/template-preview/test",
      },
      {
        path: "${APP.homepage}/test1",
      },
      {
        path: "${APP.homepage}/test2",
      },
      {
        path: "${APP.homepage}/_dev_only_/snippet-preview/test",
      },
    ]);
  });
});
