import "moment";
import "moment/locale/zh-cn";
import React from "react";
import ReactDOM from "react-dom";
import { Result } from "antd";
import { createRuntime, httpErrorToString } from "@easyops/brick-kit";
import {
  http,
  HttpRequestConfig,
  HttpResponse,
  HttpError,
} from "@easyops/brick-http";
import { initializeLibrary } from "@easyops/fontawesome-library";

import "./antd";
import "./styles/variables.css";
import "./styles/antd.less";
import "./styles/antd-compatible.less";
import "./styles/default.css";
import i18n from "./i18n";
import { K, NS_BRICK_CONTAINER } from "./i18n/constants";
import { apiAnalyzer } from "./analytics";

initializeLibrary();

// These constants bellow are defined by `webpack.DefinePlugin`.
// eslint-disable-next-line
// @ts-ignore
window.DLL_HASH = DLL_HASH;
// eslint-disable-next-line
// @ts-ignore
window.BRICK_NEXT_VERSIONS = BRICK_NEXT_VERSIONS;
// eslint-disable-next-line
// @ts-ignore
window.BRICK_NEXT_FEATURES = BRICK_NEXT_FEATURES;

const root = document.body;

const pluginRuntime = createRuntime();

const mountPoints = {
  menuBar: root.querySelector<HTMLElement>("#menu-bar-mount-point"),
  appBar: root.querySelector<HTMLElement>("#app-bar-mount-point"),
  loadingBar: root.querySelector<HTMLElement>("#loading-bar-mount-point"),
  main: root.querySelector<HTMLElement>("#main-mount-point"),
  bg: root.querySelector<HTMLElement>("#bg-mount-point"),
  portal: root.querySelector<HTMLElement>("#portal-mount-point"),
};

const analyzer = apiAnalyzer.create();

http.interceptors.request.use(function (config: HttpRequestConfig) {
  config.meta = {
    st: Date.now(),
  };
  if (!config.options?.interceptorParams?.ignoreLoadingBar) {
    window.dispatchEvent(new CustomEvent("request.start"));
  }
  return config;
});

http.interceptors.response.use(
  function (response: HttpResponse) {
    window.dispatchEvent(new CustomEvent("request.end"));
    analyzer?.analyses(response);
    return response.data;
  },
  function (error: HttpError) {
    analyzer?.analyses(error);
    window.dispatchEvent(new CustomEvent("request.end"));
    return Promise.reject(error.error);
  }
);

async function bootstrap(): Promise<void> {
  try {
    await pluginRuntime.bootstrap(mountPoints);
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
  }
}

bootstrap();
