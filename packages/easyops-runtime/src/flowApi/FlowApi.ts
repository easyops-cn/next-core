import yaml from "js-yaml";
import { ContractApi_searchSingleContract } from "@next-api-sdk/api-gateway-sdk";
import { ContractRequest, ContractResponse, ExtField } from "@next-core/types";
import { getContract } from "./CollectContracts.js";

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
  originalArgs: unknown[],
  method?: string
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

  return getApiArgsFromApiProfile(apiProfile, originalArgs, method);
}

function getApiArgsFromApiProfile(
  {
    uri,
    method: apiMethod,
    ext_fields,
    name,
    namespace,
    serviceName,
    responseWrapper,
    version,
    isFileType,
    request,
  }: CustomApiProfile,
  originalArgs: unknown[],
  method?: string
): unknown[] {
  // `saveAs` requires the first argument to be the filename.
  const isDownload = method === "saveAs";
  let fileName: string | undefined;
  if (isDownload) {
    fileName = originalArgs.shift() as string;
  }

  const { url, args } = getTransformedUriAndRestArgs(
    uri,
    originalArgs,
    name,
    namespace,
    serviceName,
    version
  );

  return [
    ...(isDownload ? [fileName] : []),
    {
      url,
      originalUri: uri,
      method: apiMethod,
      ext_fields,
      responseWrapper,
      request,
      isFileType,
    },
    ...args,
  ];
}

function getTransformedUriAndRestArgs(
  uri: string,
  originalArgs: unknown[],
  name: string,
  namespace: string,
  serviceName: string | undefined,
  version?: string
): { url: string; args: unknown[] } {
  const prefix = version
    ? serviceName
      ? `api/gateway/${serviceName}`
      : `api/gateway/${namespace}.${name}@${version}`
    : `api/gateway/api_service.${namespace}.${name}`;
  const restArgs = originalArgs.slice();
  const transformedUri = uri.replace(
    /:([^/]+)/g,
    () => restArgs.shift() as string
  );
  return {
    url: prefix + transformedUri,
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
    request?: ContractRequest;
    response?: ContractResponse;
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
  request?: ContractRequest;
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
