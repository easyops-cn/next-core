import { createProviderClass } from "@next-core/brick-utils";
import { http, HttpOptions } from "@next-core/brick-http";

export const CUSTOM_API_PROVIDER = "brick-kit.provider-custom-api";

export interface CustomApiParams {
  url: string;
  method?: string;
  responseWrapper?: boolean;
}

export async function CustomApi(
  { url, method = "GET", responseWrapper = true }: CustomApiParams,
  data: unknown,
  options?: HttpOptions
): Promise<unknown> {
  const isSimpleRequest = ["get", "delete", "head"].includes(
    method.toLowerCase()
  );

  if (isSimpleRequest) {
    const response = await http.simpleRequest(method, url, {
      params: data,
      ...options,
    });
    return responseWrapper ? response.data : response;
  } else {
    const response = await http.requestWithBody(method, url, data, options);
    return responseWrapper ? response.data : response;
  }
}

export function registerCustomApi(): void {
  customElements.define(CUSTOM_API_PROVIDER, createProviderClass(CustomApi));
}
