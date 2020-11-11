const cache = new Map<string, Promise<string>>();

export function loadScript(src: string): Promise<string>;
export function loadScript(src: string[]): Promise<string[]>;
export function loadScript(src: string | string[]): Promise<string | string[]> {
  if (Array.isArray(src)) {
    return Promise.all(
      src.map<Promise<string>>((item) => loadScript(item))
    );
  }
  if (cache.has(src)) {
    return cache.get(src);
  }
  const promise = new Promise<string>((resolve, reject) => {
    const end = (): void => {
      window.dispatchEvent(new CustomEvent("request.end"));
    };
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      resolve(src);
      end();
    };
    script.onerror = (e) => {
      reject(e);
      end();
    };
    const firstScript =
      document.currentScript || document.getElementsByTagName("script")[0];
    firstScript.parentNode.insertBefore(script, firstScript);
    window.dispatchEvent(new CustomEvent("request.start"));
  });
  cache.set(src, promise);
  return promise;
}

const prefetchCache = new Set<string>();

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Link_prefetching_FAQ
export function prefetchScript(src: string | string[]): void {
  if (Array.isArray(src)) {
    for (const item of src) {
      prefetchScript(item);
    }
    return;
  }
  // Ignore scripts which already prefetched or loaded.
  if (prefetchCache.has(src) || cache.has(src)) {
    return;
  }
  prefetchCache.add(src);
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = src;
  document.head.appendChild(link);
}
