import { imagesFactory, widgetImagesFactory } from "./images.js";

window.PUBLIC_ROOT_WITH_VERSION = true;

describe("imagesFactory", () => {
  it.each<
    [
      {
        app: { id: string; isBuildPush?: boolean; currentVersion?: string };
        appId?: string;
        appRoot?: string;
        publicDeps?: any[];
        bootstrapUnionFile?: string;
      },
      string,
      string,
    ]
  >([
    [
      {
        app: {
          id: "my-app",
        },
      },
      "test.png",
      "/micro-apps/my-app/images/test.png",
    ],
    [
      {
        app: {
          id: "my-app",
          isBuildPush: true,
        },
      },
      "test.png",
      "/api/gateway/object_store.object_store.GetObject/api/v1/objectStore/bucket/next-builder/object/test.png",
    ],
    [
      {
        app: {
          id: "my-app",
        },
        appRoot: "/sa-static/",
      },
      "test.png",
      "/sa-static/-/micro-apps/my-app/images/test.png",
    ],
    [
      {
        app: {
          id: "my-app",
          currentVersion: "2.3.4",
        },
        appId: "other-app",
        appRoot: "sa-static/other-app/versions/1.2.3/webroot/",
      },
      "test.png",
      "/sa-static/my-app/versions/2.3.4/webroot/-/micro-apps/my-app/images/test.png",
    ],
    [
      {
        app: {
          id: "my-app",
          currentVersion: "2.3.4",
        },
        appId: "other-app",
        appRoot: "my-app/",
      },
      "test.png",
      "/my-app/-/micro-apps/my-app/images/test.png",
    ],
    [
      {
        app: {
          id: "my-app",
        },
        appRoot: "sa-static/micro-apps/v2/my-app/1.51.22/",
        bootstrapUnionFile: "bootstrap-union.abc.json",
        publicDeps: [
          {
            filePath: "bricks/icons/-/dist/index.a41397e0.js",
            id: "bricks/icons",
            elements: ["eo-antd-icon"],
          },
        ],
      },
      "test20230406.png",
      "/sa-static/micro-apps/v2/my-app/1.51.22/images/test20230406.png",
    ],
  ])(
    "should work",
    ({ app, appId, appRoot, publicDeps, bootstrapUnionFile }, img, src) => {
      window.APP_ID = appId;
      window.APP_ROOT = appRoot;
      window.PUBLIC_DEPS = publicDeps;
      window.BOOTSTRAP_UNION_FILE = bootstrapUnionFile;
      expect(
        imagesFactory(app.id, app.isBuildPush, app.currentVersion).get(img)
      ).toBe(src);
      delete window.APP_ID;
      delete window.APP_ROOT;
    }
  );
});

describe("widgetImagesFactory", () => {
  it.each<
    [
      {
        widgetId: string;
        widgetVersion?: string;
        publicRoot?: string;
      },
      string,
      string,
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
        widgetVersion: "1.2.3",
        publicRoot: "-/",
      },
      "test.png",
      "-/bricks/my-widget/1.2.3/dist/assets/test.png",
    ],
  ])("should work", ({ widgetId, widgetVersion, publicRoot }, img, src) => {
    window.PUBLIC_ROOT = publicRoot;
    expect(widgetImagesFactory(widgetId, widgetVersion).get(img)).toBe(src);
  });
});
