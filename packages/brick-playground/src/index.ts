import "./index.css";
// https://github.com/microsoft/monaco-editor/issues/2874
// import * as monaco from "monaco-editor";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import copy from "copy-to-clipboard";

interface Sources {
  yaml?: string;
  html?: string;
  javascript?: string;
}

function debounce(func: Function, timeout = 300) {
  let timer = -1;
  return (...args: unknown[]) => {
    if (timer !== -1) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = -1;
      func(...args);
    }, timeout) as unknown as number;
  };
}

const params = new URLSearchParams(location.search);
const mode = params.get("mode") ?? "html";

const selectType = document.querySelector(
  "#brick-playground-select-type"
) as HTMLSelectElement;
const editorColumn = document.querySelector("#brick-playground-editor-column");

let currentType = "html";
if (mode !== currentType) {
  setCurrentType(mode);
  selectType.value = mode.toUpperCase();
}

function setCurrentType(type: string) {
  currentType = type;
  editorColumn.classList.remove(type === "html" ? "yaml" : "html");
  editorColumn.classList.add(type);
}

delete document.body.dataset.loading;

const editorTypes =
  mode === "yaml" ? (["yaml"] as const) : (["html", "javascript"] as const);
const sources = {} as Sources;

const hasHash = location.hash && location.hash !== "#";
if (hasHash) {
  try {
    const pastedSources = JSON.parse(b64DecodeUnicode(location.hash.slice(1)));
    if (pastedSources) {
      for (const key of editorTypes) {
        if (typeof pastedSources[key] === "string") {
          sources[key] = pastedSources[key];
        }
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Parse pasted sources failed:", error);
  }
}

const debouncedRender = debounce(render);

for (const type of editorTypes) {
  const storageKey = `brick-playground-${type}-source`;
  if (hasHash) {
    sources[type] ??= "";
  } else {
    sources[type] = localStorage.getItem(storageKey) ?? "";
  }
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
    automaticLayout: true,
  });
  editor.onDidChangeModelContent(() => {
    sources[type] = editor.getValue();
    if (!hasHash) {
      localStorage.setItem(storageKey, sources[type]);
    }
    debouncedRender();
  });
}

const iframe = document.createElement("iframe");

let previewWin: {
  _preview_only_render(type: string, files: Sources, theme: string): unknown;
};
const iframeReady = new Promise<void>((resolve, reject) => {
  iframe.addEventListener("load", () => {
    previewWin = iframe.contentWindow as any;
    resolve();
  });
});

iframe.src = "./preview.html";
const previewContainer = document.querySelector("#brick-playground-preview");
previewContainer.append(iframe);

const selectTheme = document.querySelector(
  "#brick-playground-select-theme"
) as HTMLSelectElement;
const buttonRun = document.querySelector("#brick-playground-button-run");

const themeStorageKey = "brick-playground-theme";
let currentTheme = "Dark";
const storedTheme = localStorage.getItem(themeStorageKey) ?? "Dark";
if (storedTheme !== currentTheme) {
  setCurrentTheme(storedTheme);
  selectTheme.value = storedTheme;
}

async function render(): Promise<void> {
  await iframeReady;
  previewWin._preview_only_render(mode, sources, currentTheme.toLowerCase());
}

buttonRun.addEventListener("click", render);

selectType.addEventListener("change", (event) => {
  location.assign(
    `?mode=${(event.target as HTMLSelectElement).value.toLowerCase()}`
  );
});

function setCurrentTheme(theme: string, store?: boolean) {
  currentTheme = theme;
  if (store) {
    localStorage.setItem(themeStorageKey, theme);
  }
}

selectTheme.addEventListener("change", (event) => {
  setCurrentTheme((event.target as HTMLSelectElement).value, true);
  render();
});

render();

const shareButton = document.querySelector("#brick-playground-button-share");
const shareResult = document.querySelector("#brick-playground-share-result");
let shareButtonResetTimeout = -1;
shareButton.addEventListener("click", () => {
  if (shareButtonResetTimeout !== -1) {
    shareResult.textContent = "";
    clearTimeout(shareButtonResetTimeout);
  }
  history.replaceState(
    null,
    "",
    `#${b64EncodeUnicode(JSON.stringify(sources))}`
  );
  const result = copy(location.href);
  shareResult.textContent = result ? "URL copied" : "Failed to copy URL";
  shareButtonResetTimeout = setTimeout(() => {
    shareButtonResetTimeout = -1;
    shareResult.textContent = "";
  }, 2000) as unknown as number;
});

function b64EncodeUnicode(str: string) {
  // first we use encodeURIComponent to get percent-encoded UTF-8,
  // then we convert the percent encodings into raw bytes which
  // can be fed into btoa.
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
}

function b64DecodeUnicode(str: string) {
  return decodeURIComponent(
    [...atob(str)]
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
}
