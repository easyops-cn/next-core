import {
  createRuntime,
  applyTheme,
  unstable_createRoot,
  __secret_internals,
} from "@next-core/runtime";
import { http, HttpError, HttpResponse } from "@next-core/http";
import type { BrickPackage } from "@next-core/types";
import { safeLoad, JSON_SCHEMA } from "js-yaml";
import "@next-core/theme";

interface RenderRequest {
  type: RenderType;
  sources: Sources;
  options?: RenderOptions;
}

http.interceptors.request.use((config) => {
  if (!config.options?.interceptorParams?.ignoreLoadingBar) {
    window.dispatchEvent(new Event("request.start"));
  }
  return config;
});

http.interceptors.response.use(
  function (response: HttpResponse) {
    window.dispatchEvent(new Event("request.end"));
    return response;
  },
  function (error: HttpError) {
    window.dispatchEvent(new Event("request.end"));
    return Promise.reject(error);
  }
);

const loadingBar = document.querySelector("#global-loading-bar");
loadingBar.classList.add("rendered");

let loading = false;
let count = 0;
function updateLoadingStatus() {
  const hasRemainingRequests = count > 0;
  if (hasRemainingRequests !== loading) {
    loading = hasRemainingRequests;
    loadingBar.classList[hasRemainingRequests ? "add" : "remove"]("loading");
  }
}
const requestStart = (): void => {
  count++;
  updateLoadingStatus();
};
const requestEnd = (): void => {
  // 兼容 loading bar 在某些请求开始和结束之间初始化时，`count` 可能小于 0 的情况
  if (count > 0) {
    count--;
    updateLoadingStatus();
  }
};
window.addEventListener("request.start", requestStart);
window.addEventListener("request.end", requestEnd);

createRuntime();

const container = document.querySelector("#preview-root") as HTMLElement;
const portal = document.querySelector("#portal-mount-point") as HTMLElement;
const root = unstable_createRoot(container, {
  portal,
  scope: "page",
});

const bootstrap = http
  .get<{ brickPackages: BrickPackage[] }>(window.BOOTSTRAP_FILE, {
    responseType: "json",
  })
  .then((data) => {
    __secret_internals.initializePlayground(data);
  });

let rendering = false;
let nextRequest: RenderRequest;

window._preview_only_render = (type, sources, options) => {
  if (rendering) {
    nextRequest = { type, sources, options };
  } else {
    queuedRender({ type, sources, options });
  }
};

async function queuedRender(request: RenderRequest) {
  rendering = true;
  try {
    const { type, sources, options } = request;
    // Assert: `render()` will not throw
    await render(type, sources, options);
  } finally {
    rendering = false;
    if (nextRequest) {
      const req = nextRequest;
      nextRequest = undefined;
      queuedRender(req);
    }
  }
}

async function render(
  type: "html" | "yaml",
  { yaml, html, javascript }: Sources,
  { theme, context, functions, templates, i18n }: RenderOptions = {}
): Promise<void> {
  try {
    document.body.classList.remove("bootstrap-error");
    if (type === "html") {
      // document.documentElement.dataset.theme =
      //   theme === "light" ? theme : "dark-v2";
      applyTheme(theme === "light" ? theme : "dark-v2");
      // Note: if use DOMParser, script tags will not be executed, while using
      // createContextualFragment they will.
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, "text/html");
      // const dom = document.createRange().createContextualFragment(html);
      const nodes = dom.querySelectorAll("*");
      const bricks = new Set<string>();
      for (const node of nodes) {
        if (node.tagName.includes("-")) {
          const lowerTagName = node.tagName.toLowerCase();
          bricks.add(lowerTagName);
        }
      }

      await bootstrap;

      await __secret_internals.loadBricks(bricks);
      container.textContent = "";
      portal.textContent = "";
      container.append(...dom.body.childNodes);
      // container.append(dom);
      const scriptTag = document.createElement("script");
      scriptTag.text = javascript;
      scriptTag.type = "module";
      container.appendChild(scriptTag);
    } else {
      const parsed = yaml
        ? (safeLoad(yaml, { schema: JSON_SCHEMA, json: true }) as any)
        : null;
      const bricks = parsed ?? [];

      const parsedContext = loadYaml(context) as any[];
      const parsedFunctions = loadYaml(functions) as any[];
      const parsedTemplates = loadYaml(templates) as any[];
      const parsedI18n = loadYaml(i18n) as any;

      await bootstrap;
      await root.render(bricks, {
        theme: theme === "light" ? theme : "dark-v2",
        context: parsedContext,
        functions: parsedFunctions,
        templates: parsedTemplates,
        i18n: parsedI18n,
      });
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Render failed:", e);

    // `.bootstrap-error` makes loading-bar invisible.
    document.body.classList.add("bootstrap-error");

    portal.textContent = "";
    container.textContent = `Render failed: ${String(e)}`;
  }
}

function loadYaml(content: unknown) {
  return typeof content === "string"
    ? safeLoad(content, { schema: JSON_SCHEMA, json: true })
    : content;
}
