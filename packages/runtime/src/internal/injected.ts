import type { BrickPackage } from "@next-core/types";

// Allow inject brick packages in a runtime other than Brick Next.
export const injectedBrickPackages: BrickPackage[] | null =
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  typeof BRICK_PACKAGES !== "undefined" ? BRICK_PACKAGES : null;
