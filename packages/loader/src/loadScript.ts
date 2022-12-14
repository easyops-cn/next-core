const cache = new Map<string, Promise<string>>();

export default function loadScript(
  src: string,
  prefix?: string
): Promise<string>;
export default function loadScript(
  src: string[],
  prefix?: string
): Promise<string[]>;
export default function loadScript(
  src: string | string[],
  prefix?: string
): Promise<string | string[]> {
  if (Array.isArray(src)) {
    return Promise.all(
      src.map<Promise<string>>((item) => loadScript(item, prefix))
    );
  }
  const fixedSrc = prefix ? `${prefix}${src}` : src;
  const cachedPromise = cache.get(fixedSrc);
  if (cachedPromise) {
    return cachedPromise;
  }
  const promise = new Promise<string>((resolve, reject) => {
    const end = (): void => {
      window.dispatchEvent(new CustomEvent("request.end"));
    };
    const script = document.createElement("script");
    script.src = fixedSrc;
    script.type = "text/javascript";
    script.async = true;
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
    (firstScript.parentNode as Node).insertBefore(script, firstScript);
    window.dispatchEvent(new CustomEvent("request.start"));
  });
  cache.set(fixedSrc, promise);
  return promise;
}
