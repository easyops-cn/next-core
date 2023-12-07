import "moment";
import "moment/locale/zh-cn";
import React from "react";
import ReactDOM from "react-dom";
import { Result } from "antd";
import {
  createRuntime,
  getAuth,
  httpErrorToString,
  getMockInfo,
  getRuntime,
  getRuntimeMisc,
  getHistory,
  abortController,
} from "@next-core/brick-kit";
import { FeatureFlags, PluginHistory } from "@next-core/brick-types";
import {
  http,
  HttpRequestConfig,
  HttpResponse,
  HttpError,
  createHttpInstance,
  defaultAdapter,
} from "@next-core/brick-http";
import { initializeLibrary } from "@next-core/fontawesome-library";
import { apiAnalyzer } from "@next-core/easyops-analytics";
import "./XMLHttpRequest";
import "./antd";
import "@next-core/theme";
import "./styles/antd.less";
import "./styles/antd-compatible.less";
import "./styles/default.css";
import "@next-core/brick-icons/dist/styles/index.css";
import i18n from "./i18n";
import { K, NS_BRICK_CONTAINER } from "./i18n/constants";
import { httpCacheAdapter } from "./httpCacheAdapter";
import { getSpanId } from "./utils";
import { listen } from "./preview/listen";

initializeLibrary();

// These constants bellow are defined by `webpack.DefinePlugin`.
// eslint-disable-next-line
// @ts-ignore
window.DLL_PATH = DLL_PATH;
// eslint-disable-next-line
// @ts-ignore
window.BRICK_NEXT_VERSIONS = BRICK_NEXT_VERSIONS;
// eslint-disable-next-line
// @ts-ignore
window.BRICK_NEXT_FEATURES = BRICK_NEXT_FEATURES;

const root = document.body;

const runtime = createRuntime();

const mountPoints = {
  menuBar: root.querySelector<HTMLElement>("#menu-bar-mount-point"),
  appBar: root.querySelector<HTMLElement>("#app-bar-mount-point"),
  loadingBar: root.querySelector<HTMLElement>("#loading-bar-mount-point"),
  main: root.querySelector<HTMLElement>("#main-mount-point"),
  bg: root.querySelector<HTMLElement>("#bg-mount-point"),
  portal: root.querySelector<HTMLElement>("#portal-mount-point"),
};

const api = `${runtime.getBasePath()}api/gateway/data_exchange.store.ClickHouseInsertData/api/v1/data_exchange/frontend_stat`;
const analyzer = apiAnalyzer.create({
  api,
});

createHttpInstance({
  adapter: httpCacheAdapter(defaultAdapter),
});

http.interceptors.request.use(function (config: HttpRequestConfig) {
  return {
    ...config,
    options: {
      ...config.options,
      signal: config.options?.noAbortOnRouteChange
        ? null
        : abortController.getSignalToken(),
    },
  };
});

http.interceptors.request.use(function (config: HttpRequestConfig) {
  const { csrfToken } = getAuth();
  const headers = new Headers(config.options?.headers || {});
  headers.set("lang", i18n.resolvedLanguage);

  csrfToken && headers.set("X-CSRF-Token", csrfToken);
  const mockInfo = getMockInfo(config.url, config.method);
  if (mockInfo) {
    config.url = mockInfo.url;
    headers.set("easyops-mock-id", mockInfo.mockId);
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

const isInSpecialFrame = (): boolean => {
  return (
    getRuntimeMisc().isInIframeOfSameSite &&
    !getRuntimeMisc().isInIframeOfVisualBuilder
  );
};

http.interceptors.request.use(function (config: HttpRequestConfig) {
  if (analyzer) {
    const { userInstanceId: uid, username } = getAuth();
    const date = Date.now();
    config.meta = {
      st: date,
      time: Math.round(date / 1000),
      uid,
      username,
    };
  }

  if (!config.options?.interceptorParams?.ignoreLoadingBar) {
    const curWindow = isInSpecialFrame() ? window.parent : window;
    curWindow.dispatchEvent(new CustomEvent("request.start"));
  }
  return config;
});

http.interceptors.response.use(
  function (response: HttpResponse) {
    const curWindow = isInSpecialFrame() ? window.parent : window;
    curWindow.dispatchEvent(new CustomEvent("request.end"));
    (getRuntime().getFeatureFlags()["enable-analyzer"] || false) &&
      analyzer?.analyses(response);
    return response.config.options?.observe === "response"
      ? response
      : response.data;
  },
  function (error: HttpError) {
    (getRuntime().getFeatureFlags()["enable-analyzer"] || false) &&
      analyzer?.analyses(error);
    const curWindow = isInSpecialFrame() ? window.parent : window;
    curWindow.dispatchEvent(new CustomEvent("request.end"));
    return Promise.reject(error.error);
  }
);

if ((window as CypressContainer).Cypress) {
  (window as CypressContainer).__test_only_getHistory = getHistory;
  (window as CypressContainer).__test_only_getBasePath =
    getRuntime().getBasePath;
  (window as CypressContainer).__test_only_getFeatureFlags =
    getRuntime().getFeatureFlags;
}

async function main(): Promise<"ok" | "failed"> {
  try {
    if (window.MOCK_DATE) {
      // For rare scenarios only, so load it on demand.
      const { set } = await import(
        /* webpackChunkName: "mockdate" */
        "mockdate"
      );
      set(window.MOCK_DATE);
    }

    await runtime.bootstrap(mountPoints);
    return "ok";
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);

    // `.bootstrap-error` makes loading-bar invisible.
    document.body.classList.add("bootstrap-error", "bars-hidden");

    ReactDOM.render(
      <Result
        status="error"
        title={i18n.t(`${NS_BRICK_CONTAINER}:${K.BOOTSTRAP_ERROR}`)}
        subTitle={httpErrorToString(e)}
      />,
      mountPoints.main
    );

    return "failed";
  }
}

const bootstrapStatus = main();

if (window.parent !== window) {
  listen(bootstrapStatus);
}

type CypressContainer = Window &
  typeof globalThis & {
    Cypress: unknown;
    __test_only_getHistory?(): PluginHistory;
    __test_only_getBasePath?(): string;
    __test_only_getFeatureFlags?(): FeatureFlags;
  };
