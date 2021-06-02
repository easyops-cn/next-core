import { BuilderRuntimeNode } from "../interfaces";
import { Story, StoryDoc } from "@next-core/brick-types";

export function getBrickDoc(
  node: BuilderRuntimeNode,
  storyList: Story[]
): StoryDoc {
  const find = storyList?.find((item) => item.storyId === node.brick);

  return find?.doc as StoryDoc;
}
