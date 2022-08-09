import { findLastIndex } from "lodash";
import type { RouteConf } from "@next-core/brick-types";

export function mergePreviewRoutes(routes: RouteConf[]): RouteConf[] {
  let mergedRoutes = routes;

  const specificTemplatePreviewIndex = findLastIndex(mergedRoutes, (route) =>
    route.path.startsWith("${APP.homepage}/_dev_only_/template-preview/")
  );
  mergedRoutes = [
    ...mergedRoutes.slice(0, specificTemplatePreviewIndex + 1),
    {
      path: "${APP.homepage}/_dev_only_/template-preview/:templateId",
      bricks: [{ brick: "span" }],
      menu: false,
      exact: true,
    } as RouteConf,
    ...mergedRoutes.slice(specificTemplatePreviewIndex + 1),
  ];

  const specificSnippetPreviewIndex = findLastIndex(mergedRoutes, (route) =>
    route.path.startsWith("${APP.homepage}/_dev_only_/snippet-preview/")
  );
  mergedRoutes = [
    ...mergedRoutes.slice(0, specificSnippetPreviewIndex + 1),
    {
      path: "${APP.homepage}/_dev_only_/snippet-preview/:snippetId",
      bricks: [{ brick: "span" }],
      menu: false,
      exact: true,
    } as RouteConf,
    ...mergedRoutes.slice(specificSnippetPreviewIndex + 1),
  ];

  const specificFormPreviewIndex = findLastIndex(mergedRoutes, (route) =>
    route.path.startsWith("${APP.homepage}/_dev_only_/form-preview/")
  );
  mergedRoutes = [
    ...mergedRoutes.slice(0, specificFormPreviewIndex + 1),
    {
      path: "${APP.homepage}/_dev_only_/form-preview/:FormId",
      bricks: [{ brick: "span" }],
      menu: false,
      exact: true,
    } as RouteConf,
    ...mergedRoutes.slice(specificFormPreviewIndex + 1),
  ];

  return mergedRoutes;
}
