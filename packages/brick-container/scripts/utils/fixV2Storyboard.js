/**
 * Fix existed v2 storyboard.
 *
 * Currently will set `expose: true` for all template states.
 *
 * @param {import("@next-core/types").Storyboard} storyboard
 */
export function fixV2Storyboard(storyboard) {
  if (Array.isArray(storyboard.meta?.customTemplates)) {
    for (const tpl of storyboard.meta.customTemplates) {
      if (Array.isArray(tpl.state)) {
        for (const item of tpl.state) {
          item.expose = true;
        }
      }
    }
  }
}
