import { createProviderClass } from "@next-core/utils/storyboard";
import { http } from "@next-core/http";

export function httpRequest(...args: Parameters<typeof http.request>) {
  return http.request(...args);
}

customElements.define("basic.http-request", createProviderClass(httpRequest));
