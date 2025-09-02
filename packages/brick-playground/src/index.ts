import "./index.css";
// https://github.com/microsoft/monaco-editor/issues/2874
import * as monaco from "monaco-editor";
import { initializeTokensProvider } from "@next-shared/monaco-textmate";
import "@next-shared/monaco-textmate/workers.js";
import tmVsDark from "@next-shared/monaco-textmate/themes/dark-modern.json";
import copy from "copy-to-clipboard";
import type {
  PreviewWindow,
  RenderType,
  Sources,
} from "@next-core/preview/types";
import { getRemoteSpellCheckWorker } from "./spellCheckRemoteWorker.js";

monaco.editor.defineTheme(
  "tm-vs-dark",
  tmVsDark as monaco.editor.IStandaloneThemeData
);

initializeTokensProvider("brick_next_yaml");
initializeTokensProvider("html");

const GZIP_HASH_PREFIX = "#gzip,";
const SPELL_CHECK = "spell_check";
const KNOWN_WORDS = [
  "microapp",
  "minmax",
  "ctrl",
  "dagre",
  "rankdir",
  "ranksep",
  "nodesep",
  "topo",
  "plaintext",
  "debuggable",
  "async",
  "searchable",
];

interface Example extends Sources {
  key: string;
  mode: "html" | "yaml";
  gap?: boolean | number | string;
}

async function main() {
  const params = new URLSearchParams(location.search);
  const paramMode = params.get("mode");
  const exampleKey = params.get("example");
  const paramCollapsed = params.get("collapsed") === "1";

  let examples: Example[];
  let matchedExample: Example;

  const models: Record<string, monaco.editor.ITextModel> = {};

  await fetch(window.EXAMPLES_FILE, {
    method: "GET",
  })
    .then((res) => res.json())
    .then((data) => {
      examples = data.examples;
      for (const example of examples) {
        const altMode = example.mode === "html" ? "yaml" : "html";
        example[altMode] = decorateAltCode(
          example[altMode],
          example.mode,
          altMode
        );
      }
    });

  const selectExample = document.querySelector(
    "#brick-playground-select-example"
  ) as HTMLSelectElement;
  const selectType = document.querySelector(
    "#brick-playground-select-type"
  ) as HTMLSelectElement;
  const editorColumn = document.querySelector(
    "#brick-playground-editor-column"
  );

  const groups = new Map<string, HTMLOptGroupElement>();
  for (const example of examples) {
    const parts = example.key.split("/");
    const groupName = parts[0];
    const group = groups.get(groupName);
    const option = document.createElement("option");
    option.value = example.key;
    option.textContent = parts.slice(1).join("/");
    if (group) {
      group.appendChild(option);
    } else {
      const optGroup = document.createElement("optgroup");
      optGroup.label = groupName;
      selectExample.appendChild(optGroup);
      optGroup.appendChild(option);
      groups.set(groupName, optGroup);
    }
  }

  selectExample.addEventListener("change", onExampleChange);

  if (exampleKey) {
    const example = examples.find((example) => example.key === exampleKey);
    if (example) {
      matchedExample = example;
      selectExample.value = example.key;
    }
  }

  let mode = paramMode
    ? paramMode === "html"
      ? "html"
      : "yaml"
    : matchedExample
      ? matchedExample.mode
      : "yaml";
  let gap: boolean | number | string = false;

  const codeFromHash =
    !matchedExample && location.hash && location.hash !== "#";
  let saveToLocalStorage = !codeFromHash;

  const sources = {} as Sources;
  const debouncedRender = debounce(render);

  function initEditorsWith(example?: Example) {
    gap = example ? example.gap : false;
    const editorTypes = [mode];
    for (const type of editorTypes) {
      if (example) {
        sources[type] = typeof example[type] === "string" ? example[type] : "";
      } else {
        const storageKey = getStorageKey(type);
        sources[type] = localStorage.getItem(storageKey) ?? "";
      }
      initEditor(type);
    }
  }

  function onExampleChange(e: Event) {
    const key = (e.target as HTMLSelectElement).value;
    if (key) {
      const newParams = new URLSearchParams();
      newParams.set("mode", mode);
      newParams.set("example", key);
      const search = `?${newParams.toString()}`;
      const example = examples.find((item) => item.key === key);
      matchedExample = example;
      initEditorsWith(example);
      saveToLocalStorage = false;
      history.replaceState(null, "", search);
    } else {
      const newParams = new URLSearchParams();
      newParams.set("mode", mode);
      const search = `?${newParams.toString()}`;
      matchedExample = undefined;
      initEditorsWith();
      saveToLocalStorage = true;
      history.replaceState(null, "", search);
    }
  }

  if (mode !== "yaml") {
    updateMode();
    selectType.value = mode.toUpperCase();
  }

  selectType.addEventListener("change", (e) => {
    mode = (e.target as HTMLSelectElement).value.toLowerCase() as RenderType;
    updateMode();
    initEditorsWith(matchedExample);
    const newParams = new URLSearchParams();
    newParams.set("mode", mode);
    if (matchedExample) {
      newParams.set("example", matchedExample.key);
    }
    const search = `?${newParams.toString()}`;
    history.replaceState(null, "", search);
  });

  function updateMode() {
    editorColumn.classList.remove(mode === "html" ? "yaml" : "html");
    editorColumn.classList.add(mode);
  }

  delete document.body.dataset.loading;

  if (matchedExample) {
    initEditorsWith(matchedExample);
  } else if (codeFromHash) {
    let decompressedExampleString: string | undefined;
    if (location.hash.startsWith(GZIP_HASH_PREFIX)) {
      try {
        decompressedExampleString = await decompress(
          location.hash.substring(GZIP_HASH_PREFIX.length)
        );
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Decompress shared example failed:", e);
      }
    }

    let pastedSources: Example;
    try {
      pastedSources = JSON.parse(
        decompressedExampleString ?? b64DecodeUnicode(location.hash.slice(1))
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Parse pasted sources failed:", error);
    }
    initEditorsWith(pastedSources ?? ({} as Example));
  } else {
    initEditorsWith();
  }

  function getStorageKey(type: string) {
    return `brick-playground-${type}-source`;
  }

  function initEditor(type: keyof Sources) {
    if (models[type]) {
      models[type].setValue(sources[type]);
      return;
    }
    const storageKey = getStorageKey(type);
    const model = monaco.editor.createModel(
      sources[type],
      type === "yaml" ? "brick_next_yaml" : type,
      monaco.Uri.file(`workspace/index.${type}`)
    );
    models[type] = model;
    const editorContainer = document.querySelector(
      `#brick-playground-${type}-editor`
    ) as HTMLElement;
    const editor = monaco.editor.create(editorContainer, {
      model,
      theme: "tm-vs-dark",
      minimap: {
        enabled: false,
      },
      scrollBeyondLastLine: false,
      tabSize: 2,
      insertSpaces: true,
      automaticLayout: true,
    });

    const debouncedSpellCheck = debounce(async () => {
      const worker = await getRemoteSpellCheckWorker();
      const { markers: spellCheckMarkers } = await worker.spellCheck({
        source: editor.getValue(),
        knownWords: KNOWN_WORDS,
      });
      monaco.editor.setModelMarkers(
        model,
        SPELL_CHECK,
        spellCheckMarkers.map(({ start, end, message, severity }) => {
          const startPos = model.getPositionAt(start);
          const endPos = model.getPositionAt(end);
          return {
            startLineNumber: startPos.lineNumber,
            startColumn: startPos.column,
            endLineNumber: endPos.lineNumber,
            endColumn: endPos.column,
            severity: monaco.MarkerSeverity[severity],
            message,
          };
        })
      );
    });

    model.onDidChangeContent((e) => {
      sources[type] = editor.getValue();
      if (saveToLocalStorage && !e.isFlush) {
        localStorage.setItem(storageKey, sources[type]);
      }
      debouncedRender();
      debouncedSpellCheck();
    });
  }

  const iframe = document.createElement("iframe");

  let previewWin: PreviewWindow;
  const iframeReady = new Promise<void>((resolve, reject) => {
    iframe.addEventListener("load", () => {
      previewWin = iframe.contentWindow as PreviewWindow;
      resolve();
    });
    iframe.addEventListener("error", (reason) => {
      reject(reason);
    });
  });

  iframe.src = "./preview/";
  const previewContainer = document.querySelector("#brick-playground-preview");
  previewContainer.append(iframe);

  const selectTheme = document.querySelector(
    "#brick-playground-select-theme"
  ) as HTMLSelectElement;
  const selectLanguage = document.querySelector(
    "#brick-playground-select-language"
  ) as HTMLSelectElement;
  const selectUIVersion = document.querySelector(
    "#brick-playground-select-ui-version"
  ) as HTMLSelectElement;
  const buttonRun = document.querySelector("#brick-playground-button-run");

  const themeStorageKey = "brick-playground-theme";
  let currentTheme = "Dark";
  const storedTheme = localStorage.getItem(themeStorageKey) ?? "Dark";
  if (storedTheme !== currentTheme) {
    setCurrentTheme(storedTheme);
    selectTheme.value = storedTheme;
  }

  const languageStorageKey = "brick-playground-language";
  let currentLanguage = "";
  const storedLanguage = localStorage.getItem(languageStorageKey) ?? "";
  if (storedLanguage !== currentLanguage) {
    setCurrentLanguage(storedLanguage);
    selectLanguage.value = storedLanguage;
  }

  const uiVersionStorageKey = "brick-playground-ui-version";
  let currentUIVersion = "8.2";
  const storedUIVersion = localStorage.getItem(uiVersionStorageKey) ?? "8.2";
  if (storedUIVersion !== currentUIVersion) {
    setCurrentUIVersion(storedUIVersion);
    selectUIVersion.value = storedUIVersion;
  }

  async function render(): Promise<void> {
    await iframeReady;
    previewWin._preview_only_render(mode, sources, {
      theme: currentTheme.toLowerCase(),
      uiVersion: currentUIVersion,
      language: currentLanguage,
      url: "https://bricks.js.org/preview/",
      app: {
        id: "brick-preview",
        name: "Brick Preview",
        homepage: "/preview",
      },
      styleText: gap
        ? `#preview-root { display: flex; flex-wrap: wrap; gap: ${gap === true ? "0.27em" : typeof gap === "number" ? `${gap}px` : gap} }`
        : undefined,
    });
  }

  buttonRun.addEventListener("click", render);

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

  function setCurrentLanguage(language: string, store?: boolean) {
    currentLanguage = language;
    if (store) {
      localStorage.setItem(languageStorageKey, language);
    }
  }

  selectLanguage.addEventListener("change", (event) => {
    setCurrentLanguage((event.target as HTMLSelectElement).value, true);
    render();
  });

  function setCurrentUIVersion(version: string, store?: boolean) {
    currentUIVersion = version;
    if (store) {
      localStorage.setItem(uiVersionStorageKey, version);
    }
  }

  selectUIVersion.addEventListener("change", (event) => {
    setCurrentUIVersion((event.target as HTMLSelectElement).value, true);
    render();
  });

  render();

  if (paramCollapsed) {
    document.body.classList.add("brick-playground-editor-collapsed");
  }

  function toggleSourceCode(collapsed: boolean) {
    document.body.classList.toggle(
      "brick-playground-editor-collapsed",
      collapsed
    );
    const newParams = new URLSearchParams(location.search);
    if (collapsed) {
      newParams.set("collapsed", "1");
    } else {
      newParams.delete("collapsed");
    }
    history.replaceState(null, "", `?${newParams}${location.hash}`);
  }

  const collapseButton = document.querySelector(
    "#brick-playground-button-collapse"
  );
  const expandButton = document.querySelector(
    "#brick-playground-button-expand"
  );
  collapseButton.addEventListener("click", () => {
    toggleSourceCode(true);
  });
  expandButton.addEventListener("click", () => {
    toggleSourceCode(false);
  });

  const shareButton = document.querySelector("#brick-playground-button-share");
  const shareResult = document.querySelector("#brick-playground-share-result");
  let shareButtonResetTimeout = -1;
  shareButton.addEventListener("click", async () => {
    if (shareButtonResetTimeout !== -1) {
      shareResult.textContent = "";
      clearTimeout(shareButtonResetTimeout);
    }
    let ok = false;
    try {
      history.replaceState(
        null,
        "",
        `${GZIP_HASH_PREFIX}${await compress(
          JSON.stringify({ [mode]: sources[mode] })
        )}`
      );
      ok = copy(location.href);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Compress shared example failed:", e);
    }
    shareResult.textContent = ok ? "URL copied" : "Failed to copy URL";
    shareButtonResetTimeout = setTimeout(() => {
      shareButtonResetTimeout = -1;
      shareResult.textContent = "";
    }, 2000) as unknown as number;
  });
}

function base64ToBytes(base64: string): Uint8Array {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0));
}

function bytesToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (x) => String.fromCodePoint(x)).join("");
  return btoa(binString);
}

async function compress(str: string) {
  const blob = new Blob([str], { type: "text/plain" });
  const stream = blob.stream().pipeThrough(new CompressionStream("gzip"));
  const compressedBlob = await new Response(stream).blob();
  return bytesToBase64(new Uint8Array(await compressedBlob.arrayBuffer()));
}

async function decompress(str: string) {
  const bytes = base64ToBytes(str);
  const blob = new Blob([bytes], { type: "text/plain" });
  const stream = blob.stream().pipeThrough(new DecompressionStream("gzip"));
  const decompressedBlob = await new Response(stream).blob();
  return decompressedBlob.text();
}

function b64DecodeUnicode(str: string): string {
  return new TextDecoder().decode(base64ToBytes(str));
}

function decorateAltCode(code: string, mode: string, altMode: string): string {
  return `${
    altMode === mode
      ? ""
      : altMode === "yaml"
        ? "# Note: this example is original written in HTML and auto-transpiled to YAML\n"
        : "<!-- Note: this example is original written in YAML and auto-transpiled to HTML -->\n"
  }${code}`;
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

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
});
