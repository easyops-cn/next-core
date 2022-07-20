import { createProviderClass } from "@next-core/brick-utils";
import {
  ExtField,
  ContractRequest,
  ContractField,
  ContractFieldItem,
} from "@next-core/brick-types";
import { http, HttpOptions } from "@next-core/brick-http";
import { isEmpty } from "lodash";

export const CUSTOM_API_PROVIDER = "brick-kit.provider-custom-api";

export interface CustomApiParams {
  url: string;
  method?: string;
  responseWrapper?: boolean;
  ext_fields?: ExtField[];
  request?: ContractRequest;
}

export function processExtFields(
  ext_fields: ExtField[],
  ...args: unknown[]
): { data: unknown; options: HttpOptions } {
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
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      const k = `${key}[]`;
      value.forEach((v) => {
        formData.append(k, v);
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
    method = "GET",
    responseWrapper = true,
    ext_fields = [],
    request,
  }: CustomApiParams,
  ...args: unknown[]
): Promise<unknown> {
  const isSimpleRequest = ["get", "delete", "head"].includes(
    method.toLowerCase()
  );

  let response;
  if (isSimpleRequest) {
    const [data, options] = args;
    response = await http.simpleRequest(method, url, {
      params: data,
      ...(options as HttpOptions),
    });
  } else {
    const isUploadType = hasFileType(request);
    const result = processExtFields(ext_fields, ...args);
    response = await http.requestWithBody(
      method,
      url,
      isUploadType ? transformFormData(result.data) : result.data,
      result.options
    );
  }

  return responseWrapper ? response.data : response;
}

export function registerCustomApi(): void {
  customElements.define(CUSTOM_API_PROVIDER, createProviderClass(CustomApi));
}
