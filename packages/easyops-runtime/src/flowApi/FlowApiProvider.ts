import { createProviderClass } from "@next-core/utils/general";
import { ExtField, ContractFieldItem } from "@next-core/types";
import { http, HttpOptions, HttpParams } from "@next-core/http";
import { isEmpty, isObject } from "lodash";
import { createSSEStream } from "@next-core/utils/general";
import type {
  MinimalContractField,
  MinimalContractRequest,
} from "./FlowApi.js";

export const FLOW_API_PROVIDER = "core.provider-flow-api";

export interface CustomApiParams {
  url: string;
  originalUri?: string;
  method?: string;
  responseWrapper?: boolean;
  ext_fields?: ExtField[];
  request?: MinimalContractRequest;
  isFileType?: boolean;
  stream?: boolean;
}

function hasFields(ext_fields: ExtField[] | undefined, type: "query" | "body") {
  return ext_fields?.some((item) => item.source === type);
}

export function processExtFields(
  ext_fields: ExtField[] | undefined,
  ...args: unknown[]
): { data: unknown; options: HttpOptions } {
  const hasQueryParams = hasFields(ext_fields, "query");

  if (hasQueryParams) {
    const hasBodyParams = hasFields(ext_fields, "body");
    if (hasBodyParams) {
      // NOTE: The args order here is different from generated SDK,
      // in SDK, it's [params, data, options]
      // But we keep the current behavior for compatibility.
      const [data, params, options] = args;
      return {
        data: data,
        options: {
          params: params as HttpParams,
          ...(options as HttpOptions),
        },
      };
    }

    const [params, options] = args;
    return {
      data: {},
      options: {
        params: params as HttpParams,
        ...(options as HttpOptions),
      },
    };
  }

  // only hasBodyParams or default
  const [data, options] = args;
  return {
    data,
    options: options as HttpOptions,
  };
}

export function hasFileType(
  request: MinimalContractRequest | undefined
): boolean {
  if (request?.type !== "object") {
    return false;
  }

  const processFields = (
    fields: MinimalContractField[] | undefined
  ): boolean => {
    return (
      !isEmpty(fields) &&
      fields!.some(
        (field) =>
          ["file", "file[]"].includes((field as ContractFieldItem).type) ||
          processFields((field as ContractFieldItem).fields)
      )
    );
  };

  return processFields(request.fields);
}

export function transformFormData(
  data: Record<string, unknown> | FormData
): FormData {
  if (data instanceof FormData) {
    return data;
  }

  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      value.forEach((v) => {
        formData.append(key, v);
      });
    } else if (
      isObject(value) &&
      !(value instanceof Blob) &&
      !(value instanceof Date)
    ) {
      Object.entries(value).forEach(([k, v]) => {
        formData.append(`${key}[${k}]`, v);
      });
    } else {
      formData.append(key, value as string);
    }
  }

  return formData;
}

export async function callFlowApi(
  {
    url,
    originalUri,
    method = "GET",
    responseWrapper = true,
    ext_fields,
    request,
    isFileType,
    stream,
  }: CustomApiParams,
  ...args: unknown[]
): Promise<unknown> {
  const isSimpleRequest = ["get", "delete", "head"].includes(
    method.toLowerCase()
  );
  const defaultOptions: HttpOptions = isFileType
    ? { responseType: "blob" }
    : {};
  let response: { data?: unknown };

  if (isSimpleRequest) {
    const noParams =
      originalUri &&
      request?.type === "object" &&
      (originalUri.match(/:([^/]+)/g)?.length ?? 0) ===
        (request.fields?.length ?? 0);
    let params: HttpParams | undefined;
    let options: HttpOptions | undefined;

    if (noParams) {
      [options] = args as [HttpOptions?];
    } else {
      [params, options] = args as [HttpParams?, HttpOptions?];
    }

    if (stream) {
      const stream = await createSSEStream(http.getUrlWithParams(url, params), {
        ...defaultOptions,
        ...options,
        method,
        headers: Object.fromEntries([
          ...new Headers(options?.headers ?? {}).entries(),
        ]),
      });
      return stream;
    }

    response = await http.simpleRequest(method, url, {
      params,
      ...defaultOptions,
      ...options,
    });
  } else {
    const isUploadType = hasFileType(request);
    const result = processExtFields(ext_fields, ...args);

    const data = isUploadType
      ? transformFormData(result.data as any)
      : result.data;

    if (stream) {
      const { body, headers } = http.getBodyAndHeaders(
        data,
        result.options?.headers
      );
      const stream = await createSSEStream(url, {
        ...defaultOptions,
        ...result.options,
        method,
        headers: Object.fromEntries([...new Headers(headers ?? {}).entries()]),
        body,
      });
      return stream;
    }

    response = await http.requestWithBody(method, url, data, {
      ...defaultOptions,
      ...result.options,
    });
  }

  return (isFileType ? false : responseWrapper) ? response.data : response;
}

export function registerFlowApiProvider(): void {
  customElements.define(FLOW_API_PROVIDER, createProviderClass(callFlowApi));
}
