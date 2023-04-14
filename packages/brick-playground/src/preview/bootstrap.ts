import {
  createRuntime,
  __secret_internals,
  applyTheme,
} from "@next-core/runtime";
import { http, HttpError, HttpResponse } from "@next-core/http";
import type { BrickPackage } from "@next-core/types";
import { safeLoad, JSON_SCHEMA } from "js-yaml";
import "@next-core/theme";

interface Sources {
  yaml?: string;
  html?: string;
  javascript?: string;
}

interface RenderRequest {
  type: "html" | "yaml";
  sources: Sources;
  theme: "dark" | "light";
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

const mountPoints = {
  main: document.querySelector("#preview-root") as HTMLElement,
  portal: document.querySelector("#portal-mount-point") as HTMLElement,
};

const bootstrap = http
  .get<{ brickPackages: BrickPackage[] }>(window.BOOTSTRAP_FILE, {
    responseType: "json",
  })
  .then((data) => {
    __secret_internals.initializePreviewBootstrap(data);
  });

let rendering = false;
let nextRequest: RenderRequest;

(window as any)._preview_only_render = (
  type: "html" | "yaml",
  sources: Sources,
  theme: "dark" | "light"
) => {
  if (rendering) {
    nextRequest = { type, sources, theme };
  } else {
    queuedRender({ type, sources, theme });
  }
};

async function queuedRender(request: RenderRequest) {
  rendering = true;
  try {
    const { type, sources, theme } = request;
    // Assert: `render()` will not throw
    await render(type, sources, theme);
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
  theme: "dark" | "light"
): Promise<void> {
  document.body.classList.remove("bootstrap-error");
  try {
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
      mountPoints.main.textContent = "";
      mountPoints.portal.textContent = "";
      mountPoints.main.append(...dom.body.childNodes);
      // mountPoints.main.append(dom);
      const scriptTag = document.createElement("script");
      scriptTag.text = javascript;
      scriptTag.type = "module";
      mountPoints.main.appendChild(scriptTag);
    } else {
      const parsed = safeLoad(yaml, { schema: JSON_SCHEMA, json: true });

      await bootstrap;

      const bricks = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
      await __secret_internals.renderPreviewBricks(bricks, mountPoints, {
        sandbox: true,
        theme: theme === "light" ? theme : "dark-v2",
      });
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Render failed:", e);

    // `.bootstrap-error` makes loading-bar invisible.
    document.body.classList.add("bootstrap-error");

    mountPoints.portal.textContent = "";
    mountPoints.main.textContent = `Render failed: ${String(e)}`;
  }
}
