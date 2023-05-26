import { loadBricksImperatively } from "@next-core/loader";
import { getBrickPackages, hooks } from "../Runtime.js";

const pool = new Map<string, HTMLElement>();
export async function getProviderBrick(provider: string): Promise<HTMLElement> {
  const isFlowApi = hooks?.flowApi?.isFlowApiProvider(provider);
  if (isFlowApi) {
    provider = hooks!.flowApi!.FLOW_API_PROVIDER;
  }

  let brick = pool.get(provider);
  if (brick) {
    return brick;
  }

  if (provider.includes("-") && !customElements.get(provider)) {
    if (isFlowApi) {
      hooks!.flowApi!.registerFlowApiProvider();
    } else {
      await loadBricksImperatively([provider], getBrickPackages());

      if (!customElements.get(provider)) {
        throw new Error(`Provider not defined: "${provider}".`);
      }
    }
  }

  brick = document.createElement(provider);
  pool.set(provider, brick);
  return brick;
}
