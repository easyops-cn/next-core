import { loadBricksImperatively } from "@next-core/loader";
import {
  createRuntime,
  __secret_internals,
  applyTheme,
} from "@next-core/runtime";
import { safeLoad, JSON_SCHEMA } from "js-yaml";
import "@next-core/theme";
import "./preview.css";

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

createRuntime();

const mountPoints = {
  main: document.querySelector("#preview-root") as HTMLElement,
  portal: document.querySelector("#portal-mount-point") as HTMLElement,
};

let brickPackages: any[];
const bootstrap = fetch(window.BOOTSTRAP_FILE, {
  method: "GET",
})
  .then((res) => res.json())
  .then((data) => {
    brickPackages = data.brickPackages;
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
      // const usedCustomElements = new Set<string>();
      const bricks = new Set<string>();
      for (const node of nodes) {
        if (node.tagName.includes("-")) {
          const lowerTagName = node.tagName.toLowerCase();
          // usedCustomElements.add(lowerTagName);
          if (lowerTagName.includes(".")) {
            bricks.add(lowerTagName);
          }
        }
      }

      await bootstrap;

      await loadBricksImperatively(bricks, brickPackages);
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
        theme: theme === "light" ? theme : "dark-v2",
      });
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Render failed:", e);
    mountPoints.portal.textContent = "";
    mountPoints.main.textContent = `Render failed: ${String(e)}`;
  }
}
