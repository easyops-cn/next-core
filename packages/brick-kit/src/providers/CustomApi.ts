import { createProviderClass } from "@easyops/brick-utils";
import { http, HttpOptions } from "@easyops/brick-http";

export const CUSTOM_API_PROVIDER = "brick-kit.provider-custom-api";

export interface CustomApiParams {
  url: string;
  method?: string;
  responseWrapper?: boolean;
}

export async function CustomApi<T>(
  { url, method = "GET", responseWrapper = true }: CustomApiParams,
  data: any,
  options?: HttpOptions
): Promise<unknown> {
  const isSimpleRequest = ["get", "delete", "head"].includes(
    method.toLowerCase()
  );

  if (isSimpleRequest) {
    const response = await http.simpleRequest<any>(method, url, {
      params: data,
      ...options,
    });
    return responseWrapper ? response.data : response;
  } else {
    const response = await http.requestWithBody<any>(
      method,
      url,
      data,
      options
    );
    return responseWrapper ? response.data : response;
  }
}

export function registerCustomApi(): void {
  customElements.define(CUSTOM_API_PROVIDER, createProviderClass(CustomApi));
}
