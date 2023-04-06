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

interface Example extends Sources {
  key: string;
  mode: "html" | "yaml";
}

async function main() {
  const params = new URLSearchParams(location.search);
  const exampleKey = params.get("example");

  let examples: Example[];
  let matchedExample: Example;

  const models: Record<string, monaco.editor.ITextModel> = {};

  await fetch(window.EXAMPLES_FILE, {
    method: "GET",
  })
    .then((res) => res.json())
    .then((data) => {
      examples = data.examples;
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

  let mode = matchedExample
    ? matchedExample.mode
    : (params.get("mode") as keyof Sources) ?? "html";

  const codeFromHash =
    !matchedExample && location.hash && location.hash !== "#";
  let saveToLocalStorage = !codeFromHash;

  const sources = {} as Sources;
  const debouncedRender = debounce(render);

  function initEditorsWith(example?: Example) {
    const editorTypes =
      mode === "yaml" ? (["yaml"] as const) : (["html", "javascript"] as const);
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
      newParams.set("example", key);
      const search = `?${newParams.toString()}`;
      const example = examples.find((item) => item.key === key);
      const modeChanged = mode !== example.mode;
      mode = example.mode;
      initEditorsWith(example);
      saveToLocalStorage = false;
      history.replaceState(null, "", search);
      if (modeChanged) {
        selectType.value = mode.toUpperCase();
        updateMode();
        debouncedRender();
      }
    } else {
      const newParams = new URLSearchParams();
      newParams.set("mode", mode);
      const search = `?${newParams.toString()}`;
      initEditorsWith();
      saveToLocalStorage = true;
      history.replaceState(null, "", search);
    }
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

  if (mode !== "html") {
    updateMode();
    selectType.value = mode.toUpperCase();
  }

  selectType.addEventListener("change", (e) => {
    mode = (e.target as HTMLSelectElement).value.toLowerCase() as keyof Sources;
    updateMode();
    selectExample.value = "";
    initEditorsWith();
  });

  function updateMode() {
    editorColumn.classList.remove(mode === "html" ? "yaml" : "html");
    editorColumn.classList.add(mode);
  }

  delete document.body.dataset.loading;

  if (matchedExample) {
    initEditorsWith(matchedExample);
  } else if (codeFromHash) {
    let pastedSources: Example;
    try {
      pastedSources = JSON.parse(b64DecodeUnicode(location.hash.slice(1)));
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
      type,
      monaco.Uri.file(`workspace/index.${type === "javascript" ? "js" : type}`)
    );
    models[type] = model;
    const editorContainer = document.querySelector(
      `#brick-playground-${type}-editor`
    ) as HTMLElement;
    const editor = monaco.editor.create(editorContainer, {
      model,
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
      if (saveToLocalStorage) {
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

  iframe.src = "./preview/";
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
      `?mode=${mode}#${b64EncodeUnicode(JSON.stringify(sources))}`
    );
    const result = copy(location.href);
    shareResult.textContent = result ? "URL copied" : "Failed to copy URL";
    shareButtonResetTimeout = setTimeout(() => {
      shareButtonResetTimeout = -1;
      shareResult.textContent = "";
    }, 2000) as unknown as number;
  });
}

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

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
});
