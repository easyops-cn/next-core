import type { BrickPackage } from "@next-core/brick-types";
import { loadBricksImperatively } from "@next-core/loader";

const pool = new Map<string, HTMLElement>();
export async function getProviderBrick(
  provider: string,
  brickPackages: BrickPackage[]
): Promise<HTMLElement> {
  let brick = pool.get(provider);
  if (brick) {
    return brick;
  }

  await loadBricksImperatively([provider], brickPackages);

  if (!customElements.get(provider)) {
    throw new Error(`Provider not defined: "${provider}".`);
  }

  brick = document.createElement(provider);
  pool.set(provider, brick);
  return brick;
}
