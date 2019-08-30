const cache = new Map<string, Promise<string>>();

export function loadScript(src: string): Promise<string>;
export function loadScript(src: string[]): Promise<string[]>;
export function loadScript(src: string | string[]): Promise<string | string[]> {
  if (Array.isArray(src)) {
    return Promise.all(src.map<Promise<string>>(item => loadScript(item)));
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
    script.onerror = e => {
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
