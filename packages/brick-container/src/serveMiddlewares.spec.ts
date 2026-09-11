import {
  getMiddlewares,
  getPreMiddlewares,
} from "../serve/middlewares/getMiddlewares.js";

jest.mock(
  "@next-core/serve-helpers",
  () => ({
    serveBricks: jest.fn(() => "serve-bricks"),
  }),
  { virtual: true }
);
jest.mock("../serve/middlewares/bootstrapJson.js", () =>
  jest.fn(() => "bootstrap-json")
);
jest.mock("../serve/middlewares/mockAuth.js", () => jest.fn(() => "mock-auth"));
jest.mock("../serve/middlewares/singleAppBootstrapJson.js", () =>
  jest.fn(() => "single-app-bootstrap-json")
);
jest.mock("../serve/middlewares/standaloneBootstrapJson.js", () =>
  jest.fn(() => "standalone-bootstrap-json")
);
jest.mock("../serve/middlewares/serveBricksWithVersions.js", () =>
  jest.fn(() => "serve-bricks-with-versions")
);
jest.mock("../serve/middlewares/serveAppImages.js", () =>
  jest.fn(() => "serve-app-images")
);

type Middleware = {
  path: string;
  middleware: (req: unknown, res: ResponseMock) => void;
};

type ResponseMock = {
  send: jest.Mock;
  status: jest.Mock;
  type: jest.Mock;
};

function getResponseMock(): ResponseMock {
  const res = {
    send: jest.fn(),
    status: jest.fn(),
    type: jest.fn(),
  };
  res.status.mockReturnValue(res);
  res.type.mockReturnValue(res);
  return res;
}

describe("getMiddlewares", () => {
  it("returns standalone and local API middlewares", () => {
    const middlewares = getMiddlewares({
      baseHref: "/next/",
      localMicroApps: ["my-app"],
      localSettings: { feature: true },
      useRemote: false,
    }) as Middleware[];

    expect(middlewares.map(({ path }) => path)).toEqual([
      "/next/sa-static/my-app/versions/0.0.0/webroot/-/bootstrap.hash.json",
      "/next/api/auth/",
      "/next/api/auth/v2/bootstrap",
      "/next/api/v1/runtime_standalone",
      "/next/api/gateway/micro_app_standalone.runtime.RuntimeMicroAppStandalone/api/v1/micro_app_standalone/runtime/:appId",
      "/next/api/gateway/data_exchange.store.ClickHouseInsertData/api/v1/data_exchange/frontend_stat",
    ]);

    const response = getResponseMock();
    middlewares[3].middleware(null, response);
    expect(response.send).toHaveBeenLastCalledWith({
      code: 0,
      data: { settings: { feature: true } },
    });
    middlewares[4].middleware(null, response);
    middlewares[5].middleware(null, response);
    expect(response.send).toHaveBeenLastCalledWith({ code: 0, data: null });
  });

  it("omits local API middlewares in remote mode and defaults settings", () => {
    expect(
      getMiddlewares({
        baseHref: "/next/",
        localMicroApps: [],
        useRemote: true,
      })
    ).toEqual([]);

    const middlewares = getMiddlewares({
      baseHref: "/next/",
      localMicroApps: [],
      useRemote: false,
    }) as Middleware[];
    const response = getResponseMock();
    middlewares[2].middleware(null, response);
    expect(response.send).toHaveBeenCalledWith({
      code: 0,
      data: { settings: {} },
    });
  });
});

describe("getPreMiddlewares", () => {
  it("serves local micro app images from standalone and v3 paths", () => {
    const middlewares = getPreMiddlewares({
      baseHref: "/next/",
      localMicroApps: ["my-app"],
      userConfigByApps: { "my-app": { enabled: true } },
    }) as Middleware[];
    const paths = middlewares.map(({ path }) => path);

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

    const response = getResponseMock();
    middlewares[1].middleware(null, response);
    expect(response.type).toHaveBeenCalledWith(".yaml");
    expect(response.send).toHaveBeenCalledWith(
      "user_config_by_apps:\n  my-app:\n    enabled: true\n"
    );
  });

  it("returns an empty conf response without user config", () => {
    const middlewares = getPreMiddlewares({
      baseHref: "/next/",
      localMicroApps: ["my-app"],
    }) as Middleware[];
    const response = getResponseMock();

    middlewares[1].middleware(null, response);

    expect(response.status).toHaveBeenCalledWith(204);
    expect(response.send).toHaveBeenCalledWith();
  });
});
