import {
  __secret_internals,
  createRuntime,
  getAuth,
  httpErrorToString,
} from "@next-core/runtime";
import { http, HttpError, HttpResponse } from "@next-core/http";
import { i18n } from "@next-core/i18n";
import "@next-core/theme";
import "./XMLHttpRequest.js";

http.interceptors.request.use((config) => {
  if (!config.options?.interceptorParams?.ignoreLoadingBar) {
    window.dispatchEvent(new Event("request.start"));
  }

  const headers = new Headers(config.options?.headers || {});

  headers.set("lang", i18n.resolvedLanguage ?? i18n.language);
  const { csrfToken } = getAuth();
  csrfToken && headers.set("X-CSRF-Token", csrfToken);

  // const mockInfo = getMockInfo(config.url, config.method);
  // if (mockInfo) {
  //   config.url = mockInfo.url;
  //   headers.set("easyops-mock-id", mockInfo.mockId);
  // }

  return {
    ...config,
    options: {
      ...config.options,
      headers,
    },
  };
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

const loadingBar = document.querySelector("#global-loading-bar")!;
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

let bootstrapStatus: "loading" | "ok" | "failed" = "loading";
let previewRequested = false;

runtime.bootstrap().then(
  () => {
    bootstrapStatus = "ok";
    if (previewRequested) {
      startPreview();
    }
  },
  (error: unknown) => {
    bootstrapStatus = "failed";
    // eslint-disable-next-line no-console
    console.error("bootstrap failed:", error);

    // `.bootstrap-error` makes loading-bar invisible.
    document.body.classList.add("bootstrap-error");

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector(
      "#main-mount-point"
    )!.textContent = `bootstrap failed: ${httpErrorToString(error)}`;
  }
);

let previewStarted = false;
let previewFromOrigin: string;
let previewOptions: unknown;

async function startPreview(): Promise<void> {
  // Start preview once bootstrap is ok and preview message has also been arrived.
  if (previewStarted || bootstrapStatus === "failed" || !previewFromOrigin) {
    return;
  }
  if (bootstrapStatus === "loading") {
    previewRequested = true;
    return;
  }
  previewStarted = true;
  const localhostRegExp = /^https?:\/\/localhost(?:$|:)/;
  // Make sure preview from the expected origins.
  let previewAllowed =
    previewFromOrigin === location.origin ||
    localhostRegExp.test(previewFromOrigin) ||
    localhostRegExp.test(location.origin);
  if (!previewAllowed) {
    const { allowedPreviewFromOrigins } = runtime.getMiscSettings() as {
      allowedPreviewFromOrigins?: string[];
    };
    if (Array.isArray(allowedPreviewFromOrigins)) {
      previewAllowed = allowedPreviewFromOrigins.some(
        (origin) => origin === previewFromOrigin
      );
    }
    if (!previewAllowed) {
      // eslint-disable-next-line
      console.error(
        `Preview is disallowed, from origin: ${previewFromOrigin}, while allowing: ${JSON.stringify(
          allowedPreviewFromOrigins
        )}`
      );
    }
  }
  if (previewAllowed) {
    const helperBrickName = "devtools.preview-start";
    try {
      await __secret_internals.loadBricks([helperBrickName]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Load ${helperBrickName} failed:`, error);
    }
    if (customElements.get(helperBrickName)) {
      const devtoolsPreviewStart = document.createElement(
        helperBrickName
      ) as unknown as {
        resolve(previewFromOrigin: string, options?: unknown): void;
      };
      devtoolsPreviewStart.resolve(previewFromOrigin, previewOptions);
    }
  }
}

if (window.parent !== window) {
  const listener = async ({
    data,
    origin,
  }: MessageEvent<PreviewMessageContainerStartPreview>): Promise<void> => {
    if (
      data &&
      data.sender === "preview-container" &&
      data.type === "start-preview"
    ) {
      window.removeEventListener("message", listener);
      previewFromOrigin = origin;
      previewOptions = data.options;
      startPreview();
    }
  };
  window.addEventListener("message", listener);
}

export interface PreviewMessageContainerStartPreview {
  sender: "preview-container";
  type: "start-preview";
  options?: unknown;
}