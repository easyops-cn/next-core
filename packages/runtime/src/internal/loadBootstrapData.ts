import { http } from "@next-core/brick-http";
import { BootstrapData } from "@next-core/brick-types";

export async function loadBootstrapData(): Promise<BootstrapData> {
  if (!window.STANDALONE_MICRO_APPS) {
    throw new Error("Require `STANDALONE_MICRO_APPS`");
  }
  const data = standaloneBootstrap();
  return data;
}

async function standaloneBootstrap(): Promise<BootstrapData> {
  const bootstrapResult = await http.get<BootstrapData>(
    window.BOOTSTRAP_FILE as string
  );
  return bootstrapResult;
}
