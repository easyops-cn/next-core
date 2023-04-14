import yaml from "js-yaml";
import { ContractApi_searchSingleContract } from "@next-sdk/api-gateway-sdk";
import { CustomApiDefinition, CustomApiProfile } from "./interfaces";
import { _internalApiGetMicroAppApiOrchestrationMap } from "./Runtime";
import { getContract } from "./CollectContracts";

const flowApiDefinitionPromiseMap = new Map<
  string,
  Promise<CustomApiDefinition>
>();

// Legacy Custom API: `${namespace}@${name}`
// Flow API: `${namespace}@${name}:${version}`
export function isCustomApiProvider(provider: string): boolean {
  return provider.includes("@");
}

export async function getArgsOfCustomApi(
  provider: string,
  originalArgs: unknown[],
  method?: string
): Promise<unknown[]> {
  if (!isCustomApiProvider(provider)) {
    return originalArgs;
  }

  const isFlowApi = provider.includes(":");

  const apiDefinition = isFlowApi
    ? await fetchFlowApiDefinition(provider)
    : (await _internalApiGetMicroAppApiOrchestrationMap()).get(provider);

  if (!apiDefinition) {
    throw new Error(
      `${isFlowApi ? "Flow" : "Legacy Custom"} API not found: "${provider}"`
    );
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
  const isDownload = isFileType && method === "saveAs";
  let fileName: string;
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
  serviceName: string,
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
    request: contract.request,
  };
}

function fetchFlowApiDefinition(
  provider: string
): Promise<CustomApiDefinition> {
  let promise = flowApiDefinitionPromiseMap.get(provider);
  if (!promise) {
    promise = _fetchFlowApiDefinition(provider);
    flowApiDefinitionPromiseMap.set(provider, promise);
  }
  return promise;
}

async function _fetchFlowApiDefinition(
  provider: string
): Promise<CustomApiDefinition> {
  const [namespaceName, nameWithVersion] = provider.split("@");
  const [name, version] = nameWithVersion.split(":");

  let contract;
  if ((contract = getContract(`${namespaceName}.${name}`))) {
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
  } else {
    const { contractData } = await ContractApi_searchSingleContract({
      contractName: `${namespaceName}.${name}`,
      version,
    });

    // return undefined if don't found contract
    if (contractData) {
      return {
        name: contractData.name,
        namespace: contractData.namespace?.[0]?.name,
        serviceName: contractData.serviceName,
        version: contractData.version,
        contract: {
          endpoint: contractData.endpoint,
          response: contractData.response,
          request: contractData.request,
        },
      };
    }
  }
}