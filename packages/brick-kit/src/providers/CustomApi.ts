import { createProviderClass } from "@next-core/brick-utils";
import { ExtField } from "@next-core/brick-types";
import { http, HttpOptions } from "@next-core/brick-http";

export const CUSTOM_API_PROVIDER = "brick-kit.provider-custom-api";

export interface CustomApiParams {
  url: string;
  method?: string;
  responseWrapper?: boolean;
  ext_fields?: ExtField[];
}

export function processExtFields(
  ext_fields: ExtField[],
  ...args: unknown[]
): { data: unknown; options: HttpOptions } {
  const extFieldsMap = new Map<string, boolean>();

  const hasFields = (type: "query" | "body"): boolean => {
    return ext_fields.some((item) => item.source === type);
  };

  const hasQueryParams = hasFields("query");
  const HasBodyParams = hasFields("body");

  if (hasQueryParams && HasBodyParams) {
    const [data, params, options] = args;
    return {
      data: data,
      options: {
        params: params,
        ...(options as HttpOptions),
      },
    };
  }

  if (hasQueryParams) {
    const [params, options] = args;
    return {
      data: {} as any,
      options: {
        params: params,
        ...(options as HttpOptions),
      },
    };
  }

  // only hasBodyParams or default
  const [data, options] = args;
  return {
    data,
    options,
  };
}

export async function CustomApi(
  {
    url,
    method = "GET",
    responseWrapper = true,
    ext_fields = [],
  }: CustomApiParams,
  ...args: unknown[]
): Promise<unknown> {
  const isSimpleRequest = ["get", "delete", "head"].includes(
    method.toLowerCase()
  );

  if (isSimpleRequest) {
    const [data, options] = args;
    const response = await http.simpleRequest(method, url, {
      params: data,
      ...(options as HttpOptions),
    });
    return responseWrapper ? response.data : response;
  } else {
    const result = processExtFields(ext_fields, ...args);
    const response = await http.requestWithBody(
      method,
      url,
      result.data,
      result.options
    );
    return responseWrapper ? response.data : response;
  }
}

export function registerCustomApi(): void {
  customElements.define(CUSTOM_API_PROVIDER, createProviderClass(CustomApi));
}
