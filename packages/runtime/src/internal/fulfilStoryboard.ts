import type { RuntimeStoryboard } from "@next-core/types";
import { hooks } from "./Runtime.js";
import { registerAppI18n } from "./registerAppI18n.js";

export async function fulfilStoryboard(storyboard: RuntimeStoryboard) {
  if (storyboard.$$fulfilled) {
    return;
  }
  if (!storyboard.$$fulfilling) {
    storyboard.$$fulfilling = doFulfilStoryboard(storyboard);
  }
  return storyboard.$$fulfilling;
}

async function doFulfilStoryboard(storyboard: RuntimeStoryboard) {
  await hooks?.fulfilStoryboard?.(storyboard);
  registerAppI18n(storyboard);
  Object.assign(storyboard, {
    $$fulfilled: true,
    $$fulfilling: null,
  });
}
