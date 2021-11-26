import { imagesFactory, widgetImagesFactory } from "./images";

describe("imagesFactory", () => {
  it.each<
    [
      {
        app: { id: string; isBuildPush?: boolean };
        publicRoot?: string;
      },
      string,
      string
    ]
  >([
    [
      {
        app: {
          id: "my-app",
        },
      },
      "test.png",
      "micro-apps/my-app/images/test.png",
    ],
    [
      {
        app: {
          id: "my-app",
          isBuildPush: true,
        },
      },
      "test.png",
      "api/gateway/object_store.object_store.GetObject/api/v1/objectStore/bucket/next-builder/object/test.png",
    ],
    [
      {
        app: {
          id: "my-app",
        },
        publicRoot: "-/",
      },
      "test.png",
      "-/micro-apps/my-app/images/test.png",
    ],
  ])("should work", ({ app, publicRoot }, img, src) => {
    window.PUBLIC_ROOT = publicRoot;
    expect(imagesFactory(app.id, app.isBuildPush).get(img)).toBe(src);
  });
});

describe("widgetImagesFactory", () => {
  it.each<
    [
      {
        widgetId: string;
        publicRoot?: string;
      },
      string,
      string
    ]
  >([
    [
      {
        widgetId: "my-widget",
      },
      "test.png",
      "bricks/my-widget/dist/assets/test.png",
    ],
    [
      {
        widgetId: "my-widget",
        publicRoot: "-/",
      },
      "test.png",
      "-/bricks/my-widget/dist/assets/test.png",
    ],
  ])("should work", ({ widgetId, publicRoot }, img, src) => {
    window.PUBLIC_ROOT = publicRoot;
    expect(widgetImagesFactory(widgetId).get(img)).toBe(src);
  });
});
