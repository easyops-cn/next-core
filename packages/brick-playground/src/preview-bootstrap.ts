import { loadBricksImperatively } from "@next-core/loader";
import { __secret_internals } from "@next-core/runtime";
import { safeLoad, JSON_SCHEMA } from "js-yaml";

const mountPoints = {
  main: document.querySelector("#preview-root") as HTMLElement,
  portal: document.querySelector("#portal-mount-point") as HTMLElement,
};

let brickPackages: any[];
const bootstrap = fetch("/bootstrap.hash.json", {
  method: "GET",
})
  .then((res) => res.json())
  .then((data) => {
    brickPackages = data.brickPackages;
    __secret_internals.initializePreviewBricks(brickPackages);
  });

(window as any)._preview_only_render = async (
  type: "html" | "yaml",
  {
    yaml,
    html,
    javascript,
  }: {
    yaml: string;
    html: string;
    javascript: string;
  },
  theme: "dark" | "light"
): Promise<void> => {
  try {
    if (type === "html") {
      document.documentElement.dataset.theme =
        theme === "light" ? theme : "dark-v2";
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
      mountPoints.main.innerHTML = "";
      mountPoints.portal.innerHTML = "";
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
    console.error(e);
    mountPoints.portal.innerHTML = "";
    mountPoints.main.innerHTML = "failed";
  }
};
