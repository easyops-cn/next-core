import yaml from "js-yaml";
import { ContractApi_searchSingleContract } from "@next-api-sdk/api-gateway-sdk";
import type {
  ContractResponse,
  ExtField,
  ContractRequest,
  UseProviderContractConf,
} from "@next-core/types";
import { hasOwnProperty } from "@next-core/utils/general";
import { getContract } from "./CollectContracts.js";

export type MinimalContractRequest = Pick<ContractRequest, "type"> & {
  fields?: MinimalContractField[];
};
export type MinimalContractField =
  | {
      type: string;
      fields?: MinimalContractField[];
    }
  | {
      ref: string;
    };
export type MinimalContractResponse = Pick<
  ContractResponse,
  "type" | "wrapper"
>;

const remoteContractCache = new Map<
  string,
  Promise<CustomApiDefinition | null>
>();

// Legacy Custom API: `${namespace}@${name}`
// Flow API: `${namespace}@${name}:${version}`
export function isFlowApiProvider(provider: string): boolean {
  return provider.includes("@");
}

export async function getArgsOfFlowApi(
  provider: string,
  originalArgs: unknown[] | UseProviderContractConf,
  method?: string,
  stream?: boolean
): Promise<unknown[]> {
  if (!provider.includes(":")) {
    throw new Error(
      `You're using legacy Custom API "${provider}" which is dropped in v3, please use Flow API instead`
    );
  }

  const apiDefinition = await fetchFlowApiDefinition(provider);

  if (!apiDefinition) {
    throw new FlowApiNotFoundError(`Flow API not found: "${provider}"`);
  }

  const apiProfile = getApiProfileFromApiDefinition(provider, apiDefinition);

  return getApiArgsFromApiProfile(apiProfile, originalArgs, method, stream);
}

function getApiArgsFromApiProfile(
  api: CustomApiProfile,
  originalArgs: unknown[] | UseProviderContractConf,
  method?: string,
  stream?: boolean
): unknown[] {
  const {
    uri,
    method: apiMethod,
    ext_fields,
    responseWrapper,
    isFileType,
    request,
  } = api;
  // `saveAs` requires the first argument to be the filename.
  const isDownload = method === "saveAs";
  let filename: string | undefined;
  let fixedArgs = originalArgs;
  if (isDownload) {
    if (Array.isArray(originalArgs)) {
      fixedArgs = originalArgs.slice();
      filename = fixedArgs.shift() as string;
    } else {
      filename = originalArgs.filename;
    }
  }

  const { url, args } = getTransformedUriAndRestArgs(api, fixedArgs);

  return [
    ...(isDownload ? [filename] : []),
    {
      url,
      originalUri: uri,
      method: apiMethod,
      ext_fields,
      responseWrapper,
      request,
      isFileType,
      stream,
    },
    ...args,
  ];
}

function getTransformedUriAndRestArgs(
  api: CustomApiProfile,
  originalArgs: unknown[] | UseProviderContractConf
): { url: string; args: unknown[] } {
  const {
    uri,
    name,
    namespace,
    serviceName,
    version,
    method = "GET",
    request,
    ext_fields,
  } = api;

  const prefix = version
    ? serviceName === "logic.api.gateway" ||
      serviceName?.startsWith("logic.api.gateway.")
      ? ""
      : serviceName
        ? `api/gateway/${serviceName}`
        : `api/gateway/${namespace}.${name}@${version}`
    : `api/gateway/api_service.${namespace}.${name}`;

  let transformedUri: string;
  let restArgs: unknown[] = [];
  if (Array.isArray(originalArgs)) {
    restArgs = originalArgs.slice();
    transformedUri = uri.replace(/:([^/]+)/g, () => restArgs.shift() as string);
  } else {
    const restParams = { ...originalArgs.params };
    transformedUri = uri.replace(/:([^/]+)/g, (_, key) => {
      if (hasOwnProperty(restParams, key)) {
        const value = restParams[key] as string;
        delete restParams[key];
        return value;
      }
      throw new Error(`Missing required param: "${key}"`);
    });

    const isSimpleRequest = ["get", "delete", "head"].includes(
      method.toLowerCase()
    );
    if (isSimpleRequest) {
      const noParams =
        request?.type === "object" &&
        (uri.match(/:([^/]+)/g)?.length ?? 0) === (request.fields?.length ?? 0);
      if (!noParams) {
        restArgs.push(restParams);
      }
    } else {
      const bodyField = ext_fields?.find((item) => item.source === "body");
      if (bodyField) {
        let body: Record<string, unknown> | undefined;
        if (bodyField.name && hasOwnProperty(restParams, bodyField.name)) {
          body = restParams[bodyField.name] as Record<string, unknown>;
          delete restParams[bodyField.name];
        }
        restArgs.push(body);
      }

      const queryField = ext_fields?.find((item) => item.source === "query");
      if (queryField) {
        let query: Record<string, unknown> | undefined;
        if (queryField.name && hasOwnProperty(restParams, queryField.name)) {
          query = restParams[queryField.name] as Record<string, unknown>;
          delete restParams[queryField.name];
        }

        restArgs.push(query);
      }

      if (!bodyField && !queryField) {
        restArgs.push(restParams);
      }
    }

    if (originalArgs.options) {
      restArgs.push(originalArgs.options);
    }
  }
  return {
    url: prefix ? prefix + transformedUri : transformedUri.replace(/^\//, ""),
    args: restArgs,
  };
}

function getApiProfileFromApiDefinition(
  provider: string,
  api: CustomApiDefinition
): CustomApiProfile {
  const contract: CustomApiDefinition["contract"] =
    typeof api.contract === "string"
      ? (yaml.safeLoad(api.contract, {
          schema: yaml.JSON_SCHEMA,
          json: true,
        }) as CustomApiDefinition["contract"])
      : api.contract;
  const { uri, method = "GET", ext_fields } = contract?.endpoint ?? {};
  const responseWrapper = contract?.response
    ? contract.response.wrapper !== false
    : false;
  if (!uri) {
    throw new Error(
      `Missing endpoint.uri in contract of provider "${provider}"`
    );
  }
  return {
    uri,
    method: method.toLowerCase() === "list" ? "get" : method,
    ext_fields,
    name: api.name,
    namespace: api.namespace,
    serviceName: api.serviceName,
    version: api.version,
    isFileType: contract?.response?.type === "file",
    responseWrapper,
    request: contract?.request,
  };
}

async function fetchFlowApiDefinition(
  provider: string
): Promise<CustomApiDefinition | null> {
  const [namespaceName, nameWithVersion] = provider.split("@");
  const [name, version] = nameWithVersion.split(":");

  // Do not cache the result of `geContract`, which will lead to no contract
  // will be found when render twice immediately.
  const contract = getContract(`${namespaceName}.${name}`);
  if (contract) {
    return {
      name: contract.name,
      namespace: contract.namespaceId,
      serviceName: contract.serviceName,
      version: contract.version,
      contract: {
        endpoint: contract.endpoint,
        response: contract.response,
        request: contract.request,
      },
    };
  }
  let promise = remoteContractCache.get(provider);
  if (!promise) {
    promise = fetchFlowApiDefinitionFromRemote(namespaceName, name, version);
    remoteContractCache.set(provider, promise);
  }
  return promise;
}

async function fetchFlowApiDefinitionFromRemote(
  namespace: string,
  name: string,
  version: string
): Promise<CustomApiDefinition | null> {
  const { contractData } = await ContractApi_searchSingleContract({
    contractName: `${namespace}.${name}`,
    version,
  });

  // return undefined if don't found contract
  return contractData
    ? {
        name: contractData.name,
        namespace: contractData.namespace?.[0]?.name,
        serviceName: contractData.serviceName,
        version: contractData.version,
        contract: {
          endpoint: contractData.endpoint,
          response: contractData.response,
          request: contractData.request,
        },
      }
    : null;
}

export interface CustomApiDefinition {
  name: string;
  namespace: string;
  version?: string;
  serviceName?: string;
  contract?: {
    endpoint: {
      ext_fields?: ExtField[];
      uri: string;
      method:
        | "POST"
        | "post"
        | "PUT"
        | "put"
        | "GET"
        | "get"
        | "DELETE"
        | "delete"
        | "LIST"
        | "list"
        | "PATCH"
        | "patch"
        | "HEAD"
        | "head";
    };
    request?: MinimalContractRequest;
    response?: MinimalContractResponse;
  };
}

export interface CustomApiProfile {
  uri: string;
  method: string;
  name: string;
  namespace: string;
  serviceName?: string;
  responseWrapper: boolean;
  version?: string;
  isFileType?: boolean;
  ext_fields?: ExtField[];
  request?: MinimalContractRequest;
}

class FlowApiNotFoundError extends Error {
  constructor(message: string) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message);

    this.name = "FlowApiNotFoundError";

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // istanbul ignore else
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FlowApiNotFoundError);
    }
  }
}
