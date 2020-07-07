import { MicroApp } from "@easyops/brick-types";
import { toPath, computeRealRoutePath } from "@easyops/brick-utils";

export function getUrlByAliasFactory(app: MicroApp) {
  return function getUrlByAlias(
    alias: string,
    pathParams?: Record<string, any>,
    query?: Record<string, any>
  ): string {
    if (!app?.$$routeAliasMap.has(alias)) {
      // eslint-disable-next-line no-console
      throw new Error(`Route alias not found: ${alias}`);
    }
    const routeConf = app.$$routeAliasMap.get(alias);
    let url = toPath(
      computeRealRoutePath(routeConf.path, app) as string,
      pathParams
    );
    if (query) {
      const urlSearchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(query as Record<string, any>)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            urlSearchParams.append(key, item);
          }
        } else if (value !== undefined && value !== null && value !== "") {
          urlSearchParams.set(key, value);
        }
      }
      const queryString = urlSearchParams.toString();
      if (queryString.length > 0) {
        url += `?${queryString}`;
      }
    }
    return url;
  };
}
