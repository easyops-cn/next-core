import { useMemo } from "react";
import { BuilderRuntimeNode } from "../interfaces";

export function useCanvasList(
  rootChildNodes: BuilderRuntimeNode[]
): BuilderRuntimeNode[][] {
  return useMemo(() => {
    const mainCanvas: BuilderRuntimeNode[] = [];
    const portalCanvasList: BuilderRuntimeNode[][] = [];
    for (const child of rootChildNodes) {
      if (child.portal) {
        portalCanvasList.push([child]);
      } else {
        mainCanvas.push(child);
      }
    }
    return [mainCanvas, ...portalCanvasList, []];
  }, [rootChildNodes]);
}
