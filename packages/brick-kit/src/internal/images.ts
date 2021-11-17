import { MicroApp } from "@next-core/brick-types";

interface ImagesFactory {
  get(name: string): string;
}

export function imagesFactory(app: MicroApp): ImagesFactory {
  return {
    get(name) {
      return app.isBuildPush
        ? `api/gateway/object_store.object_store.GetObject/api/v1/objectStore/bucket/next-builder/object/${name}`
        : `${window.PUBLIC_ROOT ?? ""}micro-apps/${app.id}/images/${name}`;
    },
  };
}

export function widgetImagesFactory(widgetId: string): ImagesFactory {
  return {
    get(name) {
      return `${
        window.PUBLIC_ROOT ?? ""
      }bricks/${widgetId}/dist/assets/${name}`;
    },
  };
}
