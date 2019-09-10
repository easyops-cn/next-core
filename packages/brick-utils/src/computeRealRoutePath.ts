import { get } from "lodash";
import { MicroApp } from "@easyops/brick-types";

export function computeRealRoutePath(
  path: string | string[],
  app: MicroApp
): string | string[] {
  if (Array.isArray(path)) {
    return path.map(p => computeRealRoutePath(p, app) as string);
  }
  return path.replace(/\$\{APP(?:.([^}]+))\}/g, (_match, field) => {
    return get(app, field);
  });
}
