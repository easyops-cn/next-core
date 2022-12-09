import {
  Adapter,
  getUrlWithParams,
  HttpRequestConfig,
} from "@next-core/brick-http";

export function httpCacheAdapter(adapter: Adapter) {
  const store = new Map<string, Promise<any>>();
  let enableCache = true;

  window.addEventListener("http:cache.start", function () {
    enableCache = true;
  });

  window.addEventListener("http:cache.end", function () {
    enableCache = false;
    store.clear();
  });

  return (config: HttpRequestConfig) => {
    const { method, url, options = {}, data } = config;
    const { useCache = true, params } = options;
    if (
      ((method || "GET").toLowerCase() === "get" ||
        url.includes("cmdb.instance.PostSearch")) &&
      enableCache
    ) {
      const index = createCacheIndex(url, params, data);
      if (useCache) {
        let responsePromise = store.get(index);

        if (!responsePromise) {
          responsePromise = (async () => {
            try {
              return await adapter(config);
            } catch (e) {
              store.delete(index);
              throw e;
            }
          })();
          store.set(index, responsePromise);

          return responsePromise;
        } else {
          // eslint-disable-next-line no-console
          console.warn(
            `[http] use cached request by cache adapter --> ${getUrlFormIndex(
              index
            )}`
          );
        }
        return responsePromise;
      } else {
        store.delete(index);
        return adapter(config);
      }
    }
    return adapter(config);
  };
}

function buildSortedURL(url: string, params: Record<string, any> = {}): string {
  const builtURL = getUrlWithParams(url, params);
  const [urlPath, queryString] = builtURL.split("?");
  if (queryString) {
    const paramsPair = queryString.split("&");
    return `${urlPath}?${paramsPair.sort().join("&")}`;
  }
  return url;
}

function isObject(value: unknown): boolean {
  return (
    Object.prototype.toString.call(value) === "[object Object]" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function buildSortedData(data: any): Record<string, any> | string {
  if (typeof data === "string" || Array.isArray(data)) return data;
  if (!isObject(data)) return null;
  return Object.keys(data)
    .sort()
    .reduce((prev, next) => {
      prev[next] = (data as Record<string, any>)[next];
      return prev;
    }, {} as Record<string, any>);
}

function createCacheIndex(
  url: string,
  params: Record<string, any> = {},
  data: any
): string {
  const sortedURL = buildSortedURL(url, params);

  const sortedData = buildSortedData(data);

  return JSON.stringify({
    url: sortedURL,
    body: sortedData,
  });
}

function getUrlFormIndex(index: string): string {
  try {
    return JSON.parse(index).url;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return index;
  }
}
