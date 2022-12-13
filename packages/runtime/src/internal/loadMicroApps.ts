import { http } from "@next-core/brick-http";

export async function loadMicroApps(): Promise<any> {
  if (!window.STANDALONE_MICRO_APPS) {
    throw new Error("Require `STANDALONE_MICRO_APPS`");
  }
  const data = standaloneBootstrap();
  return data;
}

async function standaloneBootstrap(): Promise<any> {
  const bootstrapResult = http.get<any>(window.BOOTSTRAP_FILE as string);
  return bootstrapResult;
}
