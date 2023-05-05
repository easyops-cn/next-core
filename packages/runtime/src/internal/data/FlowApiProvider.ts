import { createProviderClass } from "@next-core/utils/general";
import {
  ExtField,
  ContractRequest,
  ContractField,
  ContractFieldItem,
} from "@next-core/types";
import { http, HttpOptions, HttpParams } from "@next-core/http";
import { isEmpty, isObject } from "lodash";

export const FLOW_API_PROVIDER = "core.provider-flow-api";

export interface CustomApiParams {
  url: string;
  originalUri?: string;
  method?: string;
  responseWrapper?: boolean;
  ext_fields?: ExtField[];
  request?: ContractRequest;
  isFileType?: boolean;
}
function hasFields(ext_fields: ExtField[], type: "query" | "body"): boolean {
  return ext_fields.some((item) => item.source === type);
}

export function processExtFields(
  ext_fields: ExtField[],
  ...args: unknown[]
): { data: unknown; options: HttpOptions } {
  const hasQueryParams = hasFields(ext_fields, "query");
  const hasBodyParams = hasFields(ext_fields, "body");

  if (hasQueryParams) {
    if (hasBodyParams) {
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

export function hasFileType(request: ContractRequest | undefined): boolean {
  if (!request || request.type !== "object") {
    return false;
  }

  const processFields = (fields: ContractField[] | undefined): boolean => {
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
    ext_fields = [],
    request,
    isFileType,
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
      originalUri && request?.type === "object"
        ? (originalUri.match(/:([^/]+)/g)?.length ?? 0) ===
          (request.fields?.length ?? 0)
        : false;
    let params: HttpParams | undefined;
    let options: HttpOptions | undefined;

    if (noParams) {
      [options] = args as [HttpOptions?];
    } else {
      [params, options] = args as [HttpParams?, HttpOptions?];
    }

    response = await http.simpleRequest(method, url, {
      params,
      ...defaultOptions,
      ...(options as HttpOptions),
    });
  } else {
    const isUploadType = hasFileType(request);
    const result = processExtFields(ext_fields, ...args);

    response = await http.requestWithBody(
      method,
      url,
      isUploadType ? transformFormData(result.data as any) : result.data,
      { ...defaultOptions, ...result.options }
    );
  }

  return (isFileType ? false : responseWrapper) ? response.data : response;
}

export function registerFlowApiProvider(): void {
  customElements.define(FLOW_API_PROVIDER, createProviderClass(callFlowApi));
}
