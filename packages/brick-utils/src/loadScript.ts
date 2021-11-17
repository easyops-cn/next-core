const cache = new Map<string, Promise<string>>();

export function loadScript(src: string, prefix?: string): Promise<string>;
export function loadScript(src: string[], prefix?: string): Promise<string[]>;
export function loadScript(
  src: string | string[],
  prefix?: string
): Promise<string | string[]> {
  if (Array.isArray(src)) {
    return Promise.all(
      src.map<Promise<string>>((item) => loadScript(item, prefix))
    );
  }
  const fixedSrc = prefix ? `${prefix}${src}` : src;
  if (cache.has(fixedSrc)) {
    return cache.get(fixedSrc);
  }
  const promise = new Promise<string>((resolve, reject) => {
    const end = (): void => {
      window.dispatchEvent(new CustomEvent("request.end"));
    };
    const script = document.createElement("script");
    script.src = fixedSrc;
    script.onload = () => {
      resolve(fixedSrc);
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
  cache.set(fixedSrc, promise);
  return promise;
}

const prefetchCache = new Set<string>();

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Link_prefetching_FAQ
export function prefetchScript(src: string | string[], prefix?: string): void {
  if (Array.isArray(src)) {
    for (const item of src) {
      prefetchScript(item, prefix);
    }
    return;
  }
  const fixedSrc = prefix ? `${prefix}${src}` : src;
  // Ignore scripts which already prefetched or loaded.
  if (prefetchCache.has(fixedSrc) || cache.has(fixedSrc)) {
    return;
  }
  prefetchCache.add(fixedSrc);
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = fixedSrc;
  document.head.appendChild(link);
}
