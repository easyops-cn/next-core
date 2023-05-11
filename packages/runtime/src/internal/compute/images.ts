import { escapeRegExp } from "lodash";
import { getBasePath } from "../../getBasePath.js";

export interface ImagesFactory {
  get(name: string): string;
}

export function imagesFactory(
  appId: string,
  isBuildPush?: boolean,
  version?: string
): ImagesFactory {
  return {
    get(name) {
      if (isBuildPush) {
        return `${getBasePath()}api/gateway/object_store.object_store.GetObject/api/v1/objectStore/bucket/next-builder/object/${name}`;
      }

      let suffix = window.APP_ROOT ? `${window.APP_ROOT}-/` : "";

      // In injecting menus, the current app ID maybe not the same as the
      // target app of the icon, try to replace the app ID as well as its
      // version in the suffix.
      if (window.APP_ID && window.APP_ID !== appId) {
        suffix = suffix
          .replace(
            new RegExp(`(^|/)${escapeRegExp(window.APP_ID)}/`),
            `$1${appId}/`
          )
          .replace(/\/\d+\.\d+\.\d+\//, `/${version}/`);
      }
      if (!suffix.startsWith("/")) {
        suffix = getBasePath() + suffix;
      }
      return `${suffix}micro-apps/${appId}/images/${name}`;
    },
  };
}

export function widgetImagesFactory(
  widgetId: string,
  widgetVersion?: string
): ImagesFactory {
  return {
    get(name) {
      return `${window.PUBLIC_ROOT ?? ""}bricks/${widgetId}/${
        window.PUBLIC_ROOT_WITH_VERSION && widgetVersion
          ? `${widgetVersion}/`
          : ""
      }dist/assets/${name}`;
    },
  };
}
