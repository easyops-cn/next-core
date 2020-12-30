import { BuilderCanvasData } from "../interfaces";

let cachedCanvasData: BuilderCanvasData = {
  rootId: null,
  nodes: [],
  edges: [],
};

export function setCachedCanvasData(value: BuilderCanvasData): void {
  cachedCanvasData = value;
}

export function getCachedCanvasData(): BuilderCanvasData {
  return cachedCanvasData;
}
