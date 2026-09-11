import { getPreMiddlewares } from "../serve/middlewares/getMiddlewares.js";

jest.mock(
  "@next-core/serve-helpers",
  () => ({
    getBrickPackages: jest.fn(),
    serveBricks: jest.fn(),
    tryFiles: jest.fn(),
    tryServeFiles: jest.fn(),
  }),
  { virtual: true }
);

describe("getPreMiddlewares", () => {
  it("serves local micro app images from standalone and v3 paths", () => {
    const middlewares = getPreMiddlewares({
      baseHref: "/next/",
      localMicroApps: ["my-app"],
    });
    const paths = middlewares.map(({ path }: { path: string }) => path);

    expect(paths).toEqual(
      expect.arrayContaining([
        "/next/sa-static/my-app/versions/0.0.0/webroot/-/images",
        "/next/sa-static/my-app/versions/0.0.0/webroot/-/micro-apps/my-app/images",
        "/next/sa-static/micro-apps/v3/my-app/:version/images",
        "/next/sa-static/micro-apps/v3/my-app//images",
      ])
    );
    expect(paths).not.toContain(
      "/next/sa-static/micro-apps/v3/other-app/:version/images"
    );
  });
});
