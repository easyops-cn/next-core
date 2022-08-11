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
  developHelper,
} from "@next-core/brick-kit";
import {
  http,
  HttpRequestConfig,
  HttpResponse,
  HttpError,
} from "@next-core/brick-http";
import { initializeLibrary } from "@next-core/fontawesome-library";
import { apiAnalyzer } from "@next-core/easyops-analytics";
import "./antd";
import "./styles/theme/index.css";
import "./styles/variables.css";
import "./styles/business-variables.css";
import "./styles/editor-bricks-variables.css";
import "./styles/antd.less";
import "./styles/antd-compatible.less";
import "./styles/default.css";
import "@next-core/brick-icons/dist/styles/index.css";
import i18n from "./i18n";
import { K, NS_BRICK_CONTAINER } from "./i18n/constants";

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

let analyzer: ReturnType<typeof apiAnalyzer.create>;

// Disable API stats for standalone micro-apps.
if (!window.STANDALONE_MICRO_APPS) {
  const api = `${runtime.getBasePath()}api/gateway/data_exchange.store.ClickHouseInsertData/api/v1/data_exchange/frontend_stat`;
  analyzer = apiAnalyzer.create({
    api,
  });
}

http.interceptors.request.use(function (config: HttpRequestConfig) {
  const headers = new Headers(config.options?.headers || {});
  headers.set("lang", i18n.resolvedLanguage);
  const mockInfo = getMockInfo(config.url, config.method);
  if (mockInfo) {
    config.url = mockInfo.url;
    headers.set("easyops-mock-id", mockInfo.mockId);
  }
  return {
    ...config,
    options: {
      ...config.options,
      headers,
    },
  };
});

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
    window.dispatchEvent(new CustomEvent("request.start"));
  }
  return config;
});

http.interceptors.response.use(
  function (response: HttpResponse) {
    window.dispatchEvent(new CustomEvent("request.end"));
    analyzer?.analyses(response);
    return response.config.options?.observe === "response"
      ? response
      : response.data;
  },
  function (error: HttpError) {
    analyzer?.analyses(error);
    window.dispatchEvent(new CustomEvent("request.end"));
    return Promise.reject(error.error);
  }
);

let bootstrapStatus: "loading" | "ok" | "failed" = "loading";
let previewStarted = false;
let previewFromOrigin: string;
let previewOptions: PreviewStartOptions;

async function startPreview(): Promise<void> {
  // Start preview once bootstrap is ok and preview message has also been arrived.
  if (previewStarted || bootstrapStatus !== "ok" || !previewFromOrigin) {
    return;
  }
  previewStarted = true;
  // Make sure preview from the expected origins.
  let previewAllowed =
    previewFromOrigin === location.origin ||
    /^https?:\/\/localhost(?:$|:)/.test(previewFromOrigin);
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
    const helperBrickName = "next-previewer.preview-helper";
    await developHelper.loadDynamicBricksInBrickConf({
      brick: helperBrickName,
    });
    if (customElements.get(helperBrickName)) {
      const helper = document.createElement(
        helperBrickName
      ) as unknown as PreviewHelperBrick;
      helper.start(previewFromOrigin, previewOptions);
    }
  }
}

if (window.parent) {
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
      http.enableCache(true);
      http.on("match-api-cache", (num: number) => {
        window.parent.postMessage(
          {
            type: "match-api-cache",
            sender: "preview-container",
            forwardedFor: "builder",
            num,
          },
          origin
        );
      });

      startPreview();
    }
  };
  window.addEventListener("message", listener);
}

async function bootstrap(): Promise<void> {
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
    bootstrapStatus = "ok";
  } catch (e) {
    bootstrapStatus = "failed";
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
  }

  startPreview();
}

bootstrap();

export interface PreviewHelperBrick {
  start(previewFromOrigin: string, options?: PreviewStartOptions): void;
}

export interface PreviewMessageContainerStartPreview {
  sender: "preview-container";
  type: "start-preview";
  options?: PreviewStartOptions;
}

export interface PreviewStartOptions {
  appId: string;
  templateId: string;
  settings?: {
    properties?: Record<string, unknown>;
  };
}
