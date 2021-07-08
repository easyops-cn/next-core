import { BuilderRuntimeNode } from "../interfaces";

export function isParentExpandableTemplate(
  nodes: BuilderRuntimeNode[],
  parentUid: number
): boolean {
  return nodes.find((node) => node.$$uid === parentUid).$$isExpandableTemplate;
}
