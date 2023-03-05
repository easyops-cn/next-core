import { loadBricksImperatively } from "@next-core/loader";
import { isFlowApiProvider } from "./FlowApi.js";
import {
  FLOW_API_PROVIDER,
  registerFlowApiProvider,
} from "./FlowApiProvider.js";
import { getBrickPackages } from "../Runtime.js";

const pool = new Map<string, HTMLElement>();
export async function getProviderBrick(provider: string): Promise<HTMLElement> {
  if (isFlowApiProvider(provider)) {
    provider = FLOW_API_PROVIDER;
  }

  let brick = pool.get(provider);
  if (brick) {
    return brick;
  }

  if (provider === FLOW_API_PROVIDER && !customElements.get(provider)) {
    registerFlowApiProvider();
  } else {
    await loadBricksImperatively([provider], getBrickPackages());

    if (!customElements.get(provider)) {
      throw new Error(`Provider not defined: "${provider}".`);
    }
  }

  brick = document.createElement(provider);
  pool.set(provider, brick);
  return brick;
}
