import { CustomApiOrchestration } from "./interfaces";

// The namespace of custom api has suffix of "@"，we can set `useProvider` to `${namespace}${name}` to use custom api.
export const isCustomApiProvider = (provider: string): boolean => {
  return provider?.includes("@");
};

// 这个可能没用到可以删除
export const getNameAndNamespaceOfCustomApi = (
  provider: string
): { name: string; namespace: string } => {
  const splitArray = provider.split("@");
  const [name, namespace] = [splitArray[0], splitArray[1] + "@"];
  return { name, namespace };
};

export const getUriAndMethod = (
  provider: string,
  allMicroAppApiOrchestrationMap: Map<string, CustomApiOrchestration>
): { uri: string; method: string; name: string; namespace: string } => {
  const api = allMicroAppApiOrchestrationMap.get(provider);
  if (api) {
    const { uri, method = "GET" } = api.contract?.endpoint ?? {};
    if (!uri) {
      // eslint-disable-next-line no-console
      console.error(
        'Please make sure the "${endpoint.uri}" field in contract of ' +
          `custom api "${provider}"` +
          "is correctly set."
      );
    } else {
      return {
        uri,
        method,
        name: api.name,
        namespace: api.namespace,
      };
    }
  } else {
    // eslint-disable-next-line no-console
    console.error(
      `Custom API of "${provider}" cannot be found,please make sure it exists and has been exported.`
    );
  }
};

export function getArgsOfCustomApi(
  provider: string,
  allMicroAppApiOrchestrationMap: Map<string, CustomApiOrchestration>,
  actualArgs: any[]
): any {
  const { uri, method, name, namespace } = getUriAndMethod(
    provider,
    allMicroAppApiOrchestrationMap
  );
  const { url, args } = getTransformedUriAndRestArgs(
    uri,
    actualArgs,
    name,
    namespace
  );
  return [
    {
      url,
      method,
    },
    ...args,
  ];
}

export function getTransformedUriAndRestArgs(
  uri: string,
  actualArgs: any[],
  name: string,
  namespace: string
): { url: string; args: any[] } {
  let i = 0;
  const mockPrefix = `api/gateway/cmdb.instance.${name}`;
  // const prefix = `api/gateway/${namespace}.${name}`
  const transformedUri = uri.replace(/:([^/]+)/g, (_m, p) => {
    const realArg = actualArgs[i];
    i++;
    return realArg;
  });
  return {
    url: mockPrefix + transformedUri,
    args: actualArgs.slice(i),
  };
}
