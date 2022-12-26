import type { stableLoadBricks } from "@next-core/loader";
import "./index.css";

const htmlContent = document.querySelector(
  "#brick-html-content"
) as HTMLTextAreaElement;
const iframe = document.querySelector(
  "#brick-playground-preview-iframe"
) as HTMLIFrameElement;

let brickPackages: any[];
const bootstrap = fetch("/bootstrap.hash.json", {
  method: "GET",
})
  .then((res) => res.json())
  .then((data) => {
    brickPackages = data.brickPackages;
  });

let previewWin: {
  _preview_only_stableLoadBricks: typeof stableLoadBricks;
};
let previewRoot: HTMLElement;
const iframeReady = new Promise<void>((resolve, reject) => {
  iframe.addEventListener("load", () => {
    previewWin = iframe.contentWindow as any;
    previewRoot = iframe.contentDocument.querySelector("#preview-root");
    resolve();
  });
});

const storageKey = "brick-playground-html-source";
const stored = localStorage.getItem(storageKey);

htmlContent.addEventListener("change", (e) => {
  const source = (e.target as HTMLTextAreaElement).value;
  localStorage.setItem(storageKey, source);
  render(source);
});

if (stored) {
  htmlContent.value = stored;
  render(stored);
}

async function render(source: string): Promise<void> {
  const parser = new DOMParser();
  const dom = parser.parseFromString(source, "text/html");
  const nodes = dom.querySelectorAll("*");
  const customElements = new Set<string>();
  const bricks = new Set<string>();
  for (const node of nodes) {
    if (node.tagName.includes("-")) {
      const lowerTagName = node.tagName.toLowerCase();
      customElements.add(lowerTagName);
      if (lowerTagName.includes(".")) {
        bricks.add(lowerTagName);
      }
    }
  }

  await Promise.all([iframeReady, bootstrap]);
  previewRoot.innerHTML = "loading...";

  previewWin._preview_only_stableLoadBricks(bricks, brickPackages).then(
    () => {
      previewRoot.innerHTML = "";
      previewRoot.appendChild(dom.body.firstElementChild);
    },
    (e) => {
      // eslint-disable-next-line no-console
      console.error(e);
      previewRoot.innerHTML = "failed";
    }
  );
}
