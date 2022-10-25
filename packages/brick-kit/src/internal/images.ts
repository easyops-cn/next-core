export interface ImagesFactory {
  get(name: string): string;
}

export function imagesFactory(
  appId: string,
  isBuildPush?: boolean
): ImagesFactory {
  return {
    get(name) {
      return isBuildPush
        ? `api/gateway/object_store.object_store.GetObject/api/v1/objectStore/bucket/next-builder/object/${name}`
        : `${
            window.APP_ROOT ? `${window.APP_ROOT}-/` : ""
          }micro-apps/${appId}/images/${name}`;
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
