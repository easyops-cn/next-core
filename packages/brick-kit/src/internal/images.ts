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
        const suffix = window.APP_ROOT ? `${window.APP_ROOT}-/` : "";
        if (window.APP_ID && window.APP_ID !== appId) {
          return suffix.replace(
            new RegExp(`${window.APP_ID}|/versions/.*?/`, "g"),
            (match) => {
              if (match.startsWith("/versions")) {
                return `/versions/${version}/`;
              }
              return appId;
            }
          );
        }
        return suffix;
      };
      return isBuildPush
        ? `api/gateway/object_store.object_store.GetObject/api/v1/objectStore/bucket/next-builder/object/${name}`
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
