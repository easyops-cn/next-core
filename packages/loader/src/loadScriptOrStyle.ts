const cache = new Map<string, Promise<string>>();

export default function loadScriptOrStyle(
  type: "script" | "style",
  src: string,
  prefix?: string,
  attrs?: Record<string, unknown>
): Promise<string>;
export default function loadScriptOrStyle(
  type: "script" | "style",
  src: string[],
  prefix?: string,
  attrs?: Record<string, unknown>
): Promise<string[]>;
export default function loadScriptOrStyle(
  type: "script" | "style",
  src: string | string[],
  prefix?: string,
  attrs?: Record<string, unknown>
): Promise<string | string[]> {
  if (Array.isArray(src)) {
    return Promise.all(
      src.map<Promise<string>>((item) => loadScriptOrStyle(type, item, prefix))
    );
  }
  const fixedSrc = prefix && !/^https?:/.test(src) ? `${prefix}${src}` : src;
  const cachedPromise = cache.get(fixedSrc);
  if (cachedPromise) {
    return cachedPromise;
  }
  const promise = new Promise<string>((resolve, reject) => {
    const end = (): void => {
      window.dispatchEvent(new Event("request.end"));
    };
    const element = document.createElement(
      type === "style" ? "link" : "script"
    );
    if (type === "script") {
      Object.assign(element, {
        type: "text/javascript",
        async: true,
        ...attrs,
        src: fixedSrc,
      });
    } else {
      Object.assign(element, {
        rel: "stylesheet",
        ...attrs,
        href: fixedSrc,
      });
    }
    element.onload = () => {
      resolve(fixedSrc);
      end();
    };
    element.onerror = (e) => {
      reject(e);
      end();
    };
    const firstScript =
      document.currentScript || document.getElementsByTagName("script")[0];
    (firstScript.parentNode as Node).insertBefore(element, firstScript);
    window.dispatchEvent(new Event("request.start"));
  });
  cache.set(fixedSrc, promise);
  return promise;
}
