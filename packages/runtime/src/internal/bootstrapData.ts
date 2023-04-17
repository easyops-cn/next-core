import type { BootstrapData } from "@next-core/types";

// Allow inject bootstrap data in a runtime other than Brick Next.
export const injectedBootstrapData: Partial<BootstrapData> | undefined =
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  typeof BOOTSTRAP_DATA !== "undefined" ? BOOTSTRAP_DATA : undefined;
