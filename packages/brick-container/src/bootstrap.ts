// istanbul ignore file
import {
  createRuntime,
  getBasePath,
  httpErrorToString,
  shouldReloadForError,
  resetReloadForError,
  __secret_internals,
  isNetworkError,
} from "@next-core/runtime";
import { HttpRequestConfig, http } from "@next-core/http";
import { i18n, initializeI18n } from "@next-core/i18n";
import {
  flowApi,
  checkInstalledApps,
  auth,
  checkPermissions,
  menu,
  messageDispatcher,
  analytics,
} from "@next-core/easyops-runtime";
import "@next-core/theme";
import "./XMLHttpRequest.js";
import { loadCheckLogin } from "./loadCheckLogin.js";
import { fulfilStoryboard, loadBootstrapData } from "./loadBootstrapData.js";
import { imagesFactory, widgetImagesFactory } from "./images.js";
import { getSpanId } from "./utils.js";
import { listen } from "./preview/listen.js";
import { getMock } from "./mocks.js";
import { NS, K, locales } from "./i18n.js";
import { DefaultError } from "./DefaultError.js";

customElements.define("easyops-default-error", DefaultError);

analytics.initialize(
  `${getBasePath()}api/gateway/data_exchange.store.ClickHouseInsertData/api/v1/data_exchange/frontend_stat`
);

http.interceptors.request.use(analytics.http.onRequest);

http.interceptors.request.use((config) => {
  dispatchRequestEventByConfig("request.start", config);

  const headers = new Headers(config.options?.headers || {});

  headers.set("lang", i18n.resolvedLanguage ?? i18n.language);
  const { csrfToken } = auth.getAuth();
  csrfToken && headers.set("X-CSRF-Token", csrfToken);

  const mock = getMock(config.url, config.method);
  if (mock) {
    config.url = mock.url;
    headers.set("easyops-mock-id", mock.mockId);
  }

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
  function (response, config) {
    dispatchRequestEventByConfig("request.end", config);
    return response;
  },
  function (error, config) {
    dispatchRequestEventByConfig("request.end", config);
    return Promise.reject(error);
  }
);

http.interceptors.response.use(
  analytics.http.onResponse,
  analytics.http.onResponseError
);

function dispatchRequestEventByConfig(type: string, config: HttpRequestConfig) {
  if (!config.options?.interceptorParams?.ignoreLoadingBar) {
    window.dispatchEvent(new Event(type));
  }
}

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
    pageView: analytics.pageView,
  },
});

initializeI18n(NS, locales);

async function main() {
  try {
    const [, bootstrapData] = await Promise.all([
      loadCheckLogin(),
      loadBootstrapData(),
    ]);
    await runtime.bootstrap(bootstrapData);
    resetReloadForError();
    return "ok";
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("bootstrap failed:", error);

    if (shouldReloadForError(error)) {
      location.reload();
      return "failed";
    }

    // `.bootstrap-error` makes loading-bar invisible.
    document.body.classList.add("bootstrap-error");

    const errorElement = document.createElement(
      "easyops-default-error"
    ) as DefaultError;
    errorElement.errorTitle = isNetworkError(error)
      ? i18n.t(`${NS}:${K.NETWORK_ERROR}`)
      : i18n.t(`${NS}:${K.BOOTSTRAP_ERROR}`);
    errorElement.textContent = httpErrorToString(error);
    const linkElement = document.createElement("a");
    linkElement.slot = "link";
    linkElement.href = location.href;
    linkElement.textContent = i18n.t(`${NS}:${K.RELOAD}`);
    errorElement.appendChild(linkElement);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector("#main-mount-point")!.replaceChildren(errorElement);

    return "failed";
  }
}

const bootstrapStatus = main();

if (window.parent !== window) {
  listen(bootstrapStatus);
}

// For brick next devtools only
window.__dev_only_getAllContextValues = __secret_internals.getAllContextValues;
