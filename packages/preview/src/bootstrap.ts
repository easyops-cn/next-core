// istanbul ignore file
import {
  createRuntime,
  applyTheme,
  setUIVersion,
  unstable_createRoot,
} from "@next-core/runtime";
import { http, HttpRequestConfig } from "@next-core/http";
import { loadBricksImperatively } from "@next-core/loader";
import type {
  BootstrapData,
  BrickConf,
  BrickPackage,
  ContextConf,
  CustomTemplate,
  MetaI18n,
  StoryboardFunction,
} from "@next-core/types";
import { i18n } from "@next-core/i18n";
import { safeLoad, JSON_SCHEMA } from "js-yaml";
import "@next-core/theme";
import type {
  RenderType,
  Sources,
  RenderOptions,
  PreviewWindow,
} from "../types.d.ts";
import { get } from "lodash";
import { replaceUseChildren } from "./replaceUseChildren.js";

interface RenderRequest {
  type: RenderType;
  sources: Sources;
  options?: RenderOptions;
}

http.interceptors.request.use((config) => {
  dispatchRequestEventByConfig("request.start", config);
  return config;
});

http.interceptors.response.use(
  function (response, config) {
    dispatchRequestEventByConfig("request.end", config);
    return response;
  },
  function (error, config) {
    dispatchRequestEventByConfig("request.end", config);
    return Promise.reject(error);
  }
);

function dispatchRequestEventByConfig(type: string, config: HttpRequestConfig) {
  if (!config.options?.interceptorParams?.ignoreLoadingBar) {
    window.dispatchEvent(new Event(type));
  }
}

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

const runtime = createRuntime();

const container = document.querySelector("#preview-root") as HTMLElement;
const portal = document.querySelector("#portal-mount-point") as HTMLElement;
const root = unstable_createRoot(container, {
  portal,
  scope: "page",
  unknownBricks: "silent",
});

const bootstrap = http
  .get<BootstrapData>(window.BOOTSTRAP_FILE, {
    responseType: "json",
  })
  .then((data) => {
    runtime.initialize(
      (window.BOOTSTRAP_FILE_FIELD
        ? get(data, window.BOOTSTRAP_FILE_FIELD)
        : data) as BootstrapData
    );
  });

let rendering = false;
let nextRequest: RenderRequest;

(window as PreviewWindow)._preview_only_render = (type, sources, options) => {
  if (rendering) {
    nextRequest = { type, sources, options };
  } else {
    queuedRender({ type, sources, options });
  }
};

(window as PreviewWindow)._preview_only_inject = async (
  brick,
  pkg,
  options,
  noResolve
) => {
  await loadBricksImperatively([brick], ([] as BrickPackage[]).concat(pkg));
  if (noResolve) {
    return;
  }
  const element = document.createElement(brick) as HTMLElement & {
    resolve: (options: unknown) => Promise<void>;
  };
  await element.resolve(options);
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

let initialized = false;

async function render(
  type: "html" | "yaml",
  { yaml, html }: Sources,
  {
    theme,
    uiVersion,
    language,
    context,
    functions,
    templates,
    i18n: i18nData,
    url,
    app,
    styleText,
    templatesAreArrayOfYaml,
  }: RenderOptions = {}
): Promise<void> {
  try {
    if (!initialized) {
      initialized = true;
      document.body.classList.add("bootstrap-ready");
      applyTheme(theme === "light" ? theme : "dark-v2");
    }
    document.body.classList.remove("bootstrap-error");
    if (type === "html") {
      applyTheme(theme === "light" ? theme : "dark-v2");
      setUIVersion(uiVersion);
      if (language) {
        await i18n.changeLanguage(language);
      }
      // Note: if use DOMParser, script tags will not be executed, while using
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, "text/html");
      const bricks = new Set<string>();
      for (const node of dom.body.querySelectorAll("*")) {
        if (node.tagName.includes("-")) {
          const lowerTagName = node.tagName.toLowerCase();
          bricks.add(lowerTagName);
        } else if (node.tagName === "SCRIPT") {
          const bricksInScript = (node as HTMLScriptElement).text.matchAll(
            /\bdocument\.createElement\(\s*"([a-zA-Z0-9.]+-[-a-zA-Z0-9.]+)"\s*\)/g
          );
          for (const match of bricksInScript) {
            bricks.add(match[1]);
          }
        }
      }

      await bootstrap;

      await runtime.loadBricks(bricks);
      container.replaceChildren();
      portal.replaceChildren();
      const scripts: HTMLScriptElement[] = [];
      const scriptTags = dom.querySelectorAll("script");
      for (const scriptTag of scriptTags) {
        const newScriptTag = document.createElement("script");
        newScriptTag.text = scriptTag.text;
        newScriptTag.type = "module";
        scripts.push(newScriptTag);
        scriptTag.remove();
      }
      container.append(
        ...dom.head.querySelectorAll("style"),
        ...dom.body.childNodes,
        ...scripts
      );
    } else {
      const parsed = yaml
        ? (safeLoad(yaml, { schema: JSON_SCHEMA, json: true }) as
            | BrickConf
            | BrickConf[])
        : null;
      const bricks = [].concat(parsed ?? []);
      replaceUseChildren(bricks);
      if (styleText) {
        bricks.push({
          brick: "style",
          portal: true,
          properties: {
            textContent: styleText,
          },
        });
      }

      const parsedContext = loadYaml(context) as ContextConf[];
      const parsedFunctions = loadYaml(functions) as StoryboardFunction[];
      const parsedTemplates = loadYaml(
        templates,
        templatesAreArrayOfYaml
      ) as CustomTemplate[];
      const parsedI18n = loadYaml(i18nData) as MetaI18n;

      if (Array.isArray(parsedTemplates)) {
        for (const template of parsedTemplates) {
          if (Array.isArray(template.bricks)) {
            replaceUseChildren(template.bricks);
          }
        }
      }

      await bootstrap;
      await root.render(bricks, {
        theme: theme === "light" ? theme : "dark-v2",
        uiVersion,
        language,
        context: parsedContext,
        functions: parsedFunctions,
        templates: parsedTemplates,
        i18n: parsedI18n,
        url,
        app,
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

interface YamlTemplate {
  name: string;
  yaml: string;
}

function loadYaml(content: unknown, templatesAreArrayOfYaml?: boolean) {
  return typeof content === "string"
    ? safeLoad(content, { schema: JSON_SCHEMA, json: true })
    : templatesAreArrayOfYaml
      ? (content as YamlTemplate[]).map((item) =>
          typeof item.yaml === "string"
            ? {
                ...(safeLoad(item.yaml, {
                  schema: JSON_SCHEMA,
                  json: true,
                }) as CustomTemplate),
                name: item.name,
              }
            : item
        )
      : content;
}
