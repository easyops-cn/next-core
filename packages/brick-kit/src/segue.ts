import { MicroApp, SeguesConf } from "@easyops/brick-types";
import {
  hasOwnProperty,
  toPath,
  computeRealRoutePath,
} from "@easyops/brick-utils";

export function getUrlFactory(app: MicroApp, segues: SeguesConf) {
  return function getUrl(
    segueId: string,
    pathParams?: Record<string, any>,
    query?: Record<string, any>
  ): string {
    if (!hasOwnProperty(segues, segueId)) {
      // eslint-disable-next-line no-console
      throw new Error(`Segue not found: ${segueId}`);
    }
    const segue = segues[segueId];
    if (!app?.$$routeAliasMap.has(segue.target)) {
      // eslint-disable-next-line no-console
      throw new Error(`Route alias not found: ${segue.target}`);
    }
    const routeConf = app.$$routeAliasMap.get(segue.target);
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
