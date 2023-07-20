// istanbul ignore file
import { createRuntime, httpErrorToString } from "@next-core/runtime";
import { http, HttpError, HttpResponse } from "@next-core/http";
import { i18n } from "@next-core/i18n";
import {
  flowApi,
  checkInstalledApps,
  auth,
  checkPermissions,
  menu,
  messageDispatcher,
} from "@next-core/easyops-runtime";
import "@next-core/theme";
import "./XMLHttpRequest.js";
import { loadCheckLogin } from "./loadCheckLogin.js";
import { fulfilStoryboard, loadBootstrapData } from "./loadBootstrapData.js";
import { imagesFactory, widgetImagesFactory } from "./images.js";
import { getSpanId } from "./utils.js";
import type { PreviewMessageContainerStartPreview } from "./preview/interfaces.js";

http.interceptors.request.use((config) => {
  if (!config.options?.interceptorParams?.ignoreLoadingBar) {
    window.dispatchEvent(new Event("request.start"));
  }

  const headers = new Headers(config.options?.headers || {});

  headers.set("lang", i18n.resolvedLanguage ?? i18n.language);
  const { csrfToken } = auth.getAuth();
  csrfToken && headers.set("X-CSRF-Token", csrfToken);

  // const mockInfo = getMockInfo(config.url, config.method);
  // if (mockInfo) {
  //   config.url = mockInfo.url;
  //   headers.set("easyops-mock-id", mockInfo.mockId);
  // }

  const spanId = getSpanId();
  headers.set("X-B3-Traceid", `ffffffffffffffff${spanId}`);
  headers.set("X-B3-Spanid", spanId);
  headers.set("X-B3-Sampled", "1");

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

const runtime = createRuntime({
  hooks: {
    auth,
    fulfilStoryboard,
    checkPermissions,
    flowApi,
    checkInstalledApps,
    menu,
    images: { imagesFactory, widgetImagesFactory },
    messageDispatcher,
  },
});

async function main() {
  try {
    const [, bootstrapData] = await Promise.all([
      loadCheckLogin(),
      loadBootstrapData(),
    ]);
    await runtime.bootstrap(bootstrapData);
    return "ok";
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("bootstrap failed:", error);

    // `.bootstrap-error` makes loading-bar invisible.
    document.body.classList.add("bootstrap-error");

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector(
      "#main-mount-point"
    )!.textContent = `bootstrap failed: ${httpErrorToString(error)}`;
    return "failed";
  }
}

const bootstrapStatus = main();

if (window.parent !== window) {
  const listener = async ({
    data,
    origin,
  }: MessageEvent<unknown>): Promise<void> => {
    if (isPreviewMessageContainerStartPreview(data)) {
      window.removeEventListener("message", listener);
      const initialize = (await import("./preview/initialize.js")).default;
      const ok = await initialize(bootstrapStatus, origin);
      if (ok) {
        const connect = (await import("./preview/connect.js")).default;
        connect(origin, data.options);
      }
    }
  };
  window.addEventListener("message", listener);
}

function isPreviewMessageContainerStartPreview(
  data: unknown
): data is PreviewMessageContainerStartPreview {
  return (
    (data as PreviewMessageContainerStartPreview)?.sender ===
      "preview-container" &&
    (data as PreviewMessageContainerStartPreview).type === "start-preview"
  );
}
