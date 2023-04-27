import { getBasePath } from "./getBasePath";
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
      const getSuffix = (): string => {
        let suffix = window.APP_ROOT ? `${window.APP_ROOT}-/` : "";
        if (!suffix.startsWith("/")) {
          suffix = getBasePath() + suffix;
        }
        if (window.APP_ID && window.APP_ID !== appId) {
          return suffix.replace(
            new RegExp(`/(${window.APP_ID}|\\d+.\\d+.\\d+)/`, "g"),
            (_, p1) => {
              if (p1 === window.APP_ID) {
                return `/${appId}/`;
              }
              return `/${version}/`;
            }
          );
        }
        return suffix;
      };
      return isBuildPush
        ? `${getSuffix()}api/gateway/object_store.object_store.GetObject/api/v1/objectStore/bucket/next-builder/object/${name}`
        : `${getSuffix()}micro-apps/${appId}/images/${name}`;
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
