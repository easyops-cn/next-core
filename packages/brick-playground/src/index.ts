import "./index.css";
// https://github.com/microsoft/monaco-editor/issues/2874
// import * as monaco from "monaco-editor";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";

const sources = {
  yaml: "",
  html: "",
  javascript: "",
};
const editorByContainer = new WeakMap<
  Element,
  monaco.editor.IStandaloneCodeEditor
>();

const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    editorByContainer.get(entry.target)?.layout();
  }
});

for (const type of ["yaml", "html", "javascript"] as const) {
  const storageKey = `brick-playground-${type}-source`;
  sources[type] = localStorage.getItem(storageKey) ?? "";
  const model = monaco.editor.createModel(
    sources[type],
    type,
    monaco.Uri.file(`workspace/index.${type === "javascript" ? "js" : type}`)
  );
  const editorContainer = document.querySelector(
    `#brick-playground-${type}-editor`
  ) as HTMLElement;
  const editor = monaco.editor.create(editorContainer, {
    model: model,
    theme: "vs-dark",
    minimap: {
      enabled: false,
    },
    scrollBeyondLastLine: false,
    tabSize: 2,
    insertSpaces: true,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    "bracketPairColorization.enabled": true,
  });
  editor.onDidChangeModelContent(() => {
    sources[type] = editor.getValue();
    localStorage.setItem(storageKey, sources[type]);
  });
  editorByContainer.set(editorContainer, editor);
  observer.observe(editorContainer);
}

const iframe = document.createElement("iframe");

let previewWin: {
  _preview_only_render(
    type: string,
    files: {
      yaml: string;
      html: string;
      javascript: string;
    }
  ): Promise<void>;
};
const iframeReady = new Promise<void>((resolve, reject) => {
  iframe.addEventListener("load", () => {
    previewWin = iframe.contentWindow as any;
    resolve();
  });
});

iframe.src = "/preview.html";
const previewContainer = document.querySelector("#brick-playground-preview");
previewContainer.append(iframe);

const editorColumn = document.querySelector("#brick-playground-editor-column");
const selectType = document.querySelector(
  "#brick-playground-select-type"
) as HTMLSelectElement;
const buttonRun = document.querySelector("#brick-playground-button-run");

const sourceTypeStorageKey = "brick-playground-source-type";

let currentType = "html";
const storedType = localStorage.getItem(sourceTypeStorageKey) ?? "html";
if (storedType !== currentType) {
  setCurrentType(storedType);
  selectType.value = storedType.toUpperCase();
}

async function render(): Promise<void> {
  await iframeReady;
  previewWin._preview_only_render(currentType, sources);
}

buttonRun.addEventListener("click", render);

function setCurrentType(type: string, store?: boolean) {
  currentType = type;
  editorColumn.classList.remove(type === "html" ? "yaml" : "html");
  editorColumn.classList.add(type);
  if (store) {
    localStorage.setItem(sourceTypeStorageKey, type);
  }
}

selectType.addEventListener("change", (event) => {
  setCurrentType((event.target as HTMLSelectElement).value.toLowerCase(), true);
  render();
});

delete document.body.dataset.loading;

render();
