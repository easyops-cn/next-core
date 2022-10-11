import type { RouteConf } from "@next-core/brick-types";
import { mergePreviewRoutes } from "./mergePreviewRoutes";

it("it should work-MergePreviewRouter", async () => {
  const result = mergePreviewRoutes([
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
      path: "${APP.homepage}/_dev_only_/form-preview/test",
    },
    {
      path: "${APP.homepage}/test2",
    },
    {
      path: "${APP.homepage}/_dev_only_/snippet-preview/test",
    },
  ] as RouteConf[]);
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
      path: "${APP.homepage}/_dev_only_/form-preview/test",
    },
    {
      bricks: [
        {
          brick: "span",
        },
      ],
      exact: true,
      menu: false,
      path: "${APP.homepage}/_dev_only_/form-preview/:FormId",
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
