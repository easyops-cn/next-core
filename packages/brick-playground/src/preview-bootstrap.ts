import {
  enqueueStableLoadBricks,
  flushStableLoadBricks,
} from "@next-core/loader";
import { createRuntime } from "@next-core/runtime";
// import "./preview.css";

createRuntime();

const previewRoot = document.querySelector("#preview-root");

let brickPackages: any[];
const bootstrap = fetch("/bootstrap.hash.json", {
  method: "GET",
})
  .then((res) => res.json())
  .then((data) => {
    brickPackages = data.brickPackages;
  });

(window as any)._preview_only_render = async ({
  html,
  javascript,
}: {
  html: string;
  javascript: string;
}): Promise<void> => {
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

  try {
    await enqueueStableLoadBricks(bricks, brickPackages);
    flushStableLoadBricks();
    previewRoot.innerHTML = "";
    previewRoot.append(...dom.body.childNodes);
    // previewRoot.append(dom);
    const scriptTag = document.createElement("script");
    scriptTag.text = javascript;
    scriptTag.type = "module";
    previewRoot.appendChild(scriptTag);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    previewRoot.innerHTML = "failed";
  }
};
