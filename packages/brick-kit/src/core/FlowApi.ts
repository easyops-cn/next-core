import yaml from "js-yaml";
import { InstanceApi_postSearch } from "@next-sdk/cmdb-sdk";
import { CustomApiDefinition, CustomApiProfile } from "./interfaces";
import { _internalApiGetMicroAppApiOrchestrationMap } from "./Runtime";

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
  originalArgs: unknown[]
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

  return getApiArgsFromApiProfile(apiProfile, originalArgs);
}

function getApiArgsFromApiProfile(
  {
    uri,
    method,
    name,
    namespace,
    responseWrapper,
    version,
    isFileType,
  }: CustomApiProfile,
  originalArgs: unknown[]
): unknown[] {
  let fileName: string;
  if (isFileType) {
    fileName = originalArgs.shift() as string;
  }

  const { url, args } = getTransformedUriAndRestArgs(
    uri,
    originalArgs,
    name,
    namespace,
    version
  );

  return isFileType
    ? [
        fileName,
        {
          url,
          method,
          responseWrapper: false,
        },
        ...args,
        { responseType: "blob" },
      ]
    : [
        {
          url,
          method,
          responseWrapper,
        },
        ...args,
      ];
}

function getTransformedUriAndRestArgs(
  uri: string,
  originalArgs: unknown[],
  name: string,
  namespace: string,
  version?: string
): { url: string; args: unknown[] } {
  const prefix = version
    ? `api/gateway/${namespace}.${name}@${version}`
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
  const { uri, method = "GET" } = contract?.endpoint ?? {};
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
    name: api.name,
    namespace: api.namespace,
    version: api.version,
    isFileType: contract?.response?.type === "file",
    responseWrapper,
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
  const [namespace, nameWithVersion] = provider.split("@");
  const [name, version] = nameWithVersion.split(":");
  const result = await InstanceApi_postSearch("_INTERFACE_CONTRACT@EASYOPS", {
    page: 1,
    page_size: 1,
    fields: {
      name: true,
      endpoint: true,
      response: true,
      "namespace.name": true,
      version: true,
    },
    query: {
      name,
      version,
      "namespace.name": namespace,
    },
  });
  return result.list.map((item) => ({
    name: item.name,
    namespace: item.namespace[0].name,
    version: item.version,
    contract: {
      endpoint: item.endpoint,
      response: item.response,
    },
  }))[0];
}
