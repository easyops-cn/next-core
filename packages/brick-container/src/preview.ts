import { SiteTheme, StoryConf, type MountPoints } from "@next-core/brick-types";
import { developHelper, applyTheme } from "@next-core/brick-kit";

import { http, HttpResponse, type HttpError } from "@next-core/brick-http";
import { initializeLibrary } from "@next-core/fontawesome-library";
import "./i18n";
import "@next-core/theme";
import "./styles/antd.less";
import "./styles/antd-compatible.less";
import "./styles/default.css";
import "./styles/preview.css";
import { replaceUseChildren } from "./replaceUseChildren";

initializeLibrary();
// eslint-disable-next-line
// @ts-ignore
window.DLL_PATH = DLL_PATH;
// eslint-disable-next-line
// @ts-ignore
window.BRICK_NEXT_VERSIONS = BRICK_NEXT_VERSIONS;

http.interceptors.response.use(
  function (response: HttpResponse) {
    return response.config.options?.observe === "response"
      ? response
      : response.data;
  },
  function (error: HttpError) {
    return Promise.reject(error.error);
  }
);

const main = document.querySelector<HTMLElement>("#main-mount-point");
const bg = document.querySelector<HTMLElement>("#bg-mount-point");
const portal = document.querySelector<HTMLElement>("#portal-mount-point");

type BrickPreviewProps = StoryConf;
(window as any)._preview_render = async ({
  conf,
  theme,
}: {
  conf: BrickPreviewProps;
  theme: SiteTheme;
}) => {
  applyTheme(theme);
  replaceUseChildren(([] as StoryConf[]).concat(conf));
  await developHelper.render({ main, bg, portal } as MountPoints, conf);
};
