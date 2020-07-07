import { MicroApp, SeguesConf } from "@easyops/brick-types";
import { hasOwnProperty } from "@easyops/brick-utils";
import { getUrlByAliasFactory } from "./alias";

export function getUrlBySegueFactory(app: MicroApp, segues: SeguesConf) {
  return function getUrlBySegue(
    segueId: string,
    pathParams?: Record<string, any>,
    query?: Record<string, any>
  ): string {
    if (!hasOwnProperty(segues, segueId)) {
      // eslint-disable-next-line no-console
      throw new Error(`Segue not found: ${segueId}`);
    }
    const segue = segues[segueId];
    return getUrlByAliasFactory(app)(segue.target, pathParams, query);
  };
}
