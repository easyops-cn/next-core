import { MicroApp } from "@easyops/brick-types";

export function computeRealRoutePath(
  path: string | string[],
  app: MicroApp
): string | string[] {
  if (Array.isArray(path)) {
    return path.map(p => computeRealRoutePath(p, app) as string);
  }
  if (typeof path !== "string") {
    return;
  }
  return path.replace("${APP.homepage}", app?.homepage);
}
