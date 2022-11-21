import { createProviderClass } from "@next-core/brick-utils";
import {
  ExtField,
  ContractRequest,
  ContractField,
  ContractFieldItem,
} from "@next-core/brick-types";
import { http, HttpOptions } from "@next-core/brick-http";
import { isEmpty, isObject } from "lodash";

export const CUSTOM_API_PROVIDER = "brick-kit.provider-custom-api";

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
          params: params,
          ...(options as HttpOptions),
        },
      };
    }

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

export function hasFileType(request: ContractRequest): boolean {
  let flag = false;
  if (!request) return flag;

  const processFields = (fields: ContractField[]): boolean => {
    return fields.some((field) => {
      if (["file", "file[]"].includes((field as ContractFieldItem).type)) {
        return true;
      }

      if (!isEmpty((field as ContractFieldItem).fields)) {
        return processFields((field as ContractFieldItem).fields);
      }
    });
  };

  if (request.type === "object" && !isEmpty(request.fields)) {
    flag = processFields(request.fields);
  }

  return flag;
}

export function transformFormData(data: Record<string, any>): FormData {
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
      formData.append(key, value);
    }
  }

  return formData;
}

export async function CustomApi(
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
  let response;

  if (isSimpleRequest) {
    const noParams =
      originalUri && request?.type === "object"
        ? (originalUri.match(/:([^/]+)/g)?.length ?? 0) ===
          (request.fields?.length ?? 0)
        : false;
    let params: unknown;
    let options: HttpOptions;

    if (noParams) {
      [options] = args;
    } else {
      [params, options] = args;
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
      isUploadType ? transformFormData(result.data) : result.data,
      { ...defaultOptions, ...result.options }
    );
  }

  return (isFileType ? false : responseWrapper) ? response.data : response;
}

export function registerCustomApi(): void {
  customElements.define(CUSTOM_API_PROVIDER, createProviderClass(CustomApi));
}
