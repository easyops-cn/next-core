import { StoryConf } from "@next-core/brick-types";
import { developHelper } from "@next-core/brick-kit";
import { http, HttpResponse } from "@next-core/brick-http";
import { initializeLibrary } from "@next-core/fontawesome-library";
import "./i18n";
import "./styles/theme/index.css";
import "./styles/variables.css";
import "./styles/business-variables.css";
import "./styles/editor-bricks-variables.css";
import "./styles/antd.less";
import "./styles/antd-compatible.less";
import "./styles/default.css";
import "./styles/preview.css";

initializeLibrary();
// eslint-disable-next-line
// @ts-ignore
window.DLL_PATH = DLL_PATH;

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

type BrickPreviewProps = StoryConf | StoryConf[];
(window as any)._preview_render = async ({
  conf,
}: {
  conf: BrickPreviewProps;
}) => {
  await developHelper.render({ main, bg, portal }, conf);
};
