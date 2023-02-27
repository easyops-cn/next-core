/**
 * @param storyboard {import("@next-core/types").Storyboard}
 */
export function getStandaloneConfig(storyboard) {
  return storyboard?.app.standaloneMode
    ? {
        appRoot: `sa-static/${storyboard.app.id}/versions/0.0.0/webroot/`,
        noAuthGuard: storyboard.app.noAuthGuard,
        publicPrefix: "sa-static/-/",
        coreVersion: "0.0.0",
        bootstrapHash: "hash",
      }
    : null;
}
