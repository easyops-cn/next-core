import { http } from "@next-core/http";
import { createProviderClass } from "@next-core/utils/general";
import { OutgoingHttpHeaders } from "http";

const HTTP_PROXY_PROVIDER = "core.provider-http-proxy";

export interface HttpProxyData {
  url: string;
  method: string;
  headers?: OutgoingHttpHeaders;
  queryParameters?: Record<string, any>;
  body?: any;
  timeout?: number;
}

export async function httpProxyRequest(data: HttpProxyData) {
  const result = await http.post(
    "api/gateway/logic.next_builder_service/api/v1/next-builder/proxy-http",
    data
  );

  return (result as any)?.data;
}

customElements.define(
  HTTP_PROXY_PROVIDER,
  createProviderClass(httpProxyRequest)
);
