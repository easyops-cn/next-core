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
  const fixedPrefix =
    !prefix && window.PUBLIC_ROOT ? window.PUBLIC_ROOT : prefix;
  let fixedSrc =
    fixedPrefix && !/^https?:/.test(src) ? `${fixedPrefix}${src}` : src;
  if (window.__POWERED_BY_QIANKUN__) {
    fixedSrc = new URL(
      fixedSrc,
      new URL(window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__!, location.origin)
    ).toString();
  }
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
    document.head.appendChild(element);
    window.dispatchEvent(new Event("request.start"));
  });
  cache.set(fixedSrc, promise);
  return promise;
}
