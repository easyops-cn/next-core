import {
  BrickConf,
  BuilderRouteOrBrickNode,
  RouteConf,
} from "@next-core/brick-types";
import { normalizeBuilderNode } from "./normalizeBuilderNode";

const consoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => void 0);

describe("normalizeBuilderNode", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each<[BuilderRouteOrBrickNode, BrickConf | RouteConf | null, number]>([
    [
      {
        alias: "route-a",
        id: "R-01",
        instanceId: "instance-r01",
        path: "/a",
        type: "bricks",
        parent: [], // Empty parent also works.
        providers: '["p1"]',
        segues: JSON.stringify({
          goHiking: {
            target: "hiking",
          },
          goCooking: {
            target: "cooking",
            _view: {
              controls: ["bottom", "top"],
            },
          },
        }),
        // Fields should be removed.
        _ts: 123,
        org: 1,
        previewSettings: {},
        screenshot: "data:image/png,XYZ",
        hybrid: false,
      },
      {
        alias: "route-a",
        path: "/a",
        iid: "instance-r01",
        providers: ["p1"],
        segues: {
          goHiking: {
            target: "hiking",
          },
          goCooking: {
            target: "cooking",
          },
        },
        type: "bricks",
        bricks: undefined,
      },
      0,
    ],
    [
      {
        id: "R-02",
        instanceId: "instance-r02",
        path: "/b",
        type: "routes",
        permissionsPreCheck:
          '["<% `cmdb:${QUERY.objectId}_instance_create` %>"]',
        hybrid: true,
        // Ignore when specific fields (such as `alias`) is `null`.
        alias: null,
        context: null,
        exact: null,
      },
      {
        permissionsPreCheck: ["<% `cmdb:${QUERY.objectId}_instance_create` %>"],
        path: "/b",
        type: "routes",
        iid: "instance-r02",
        hybrid: true,
      },
      0,
    ],
    [
      {
        id: "B-01",
        instanceId: "instance-b01",
        type: "brick",
        brick: "m",
        parent: [{ id: "R-01" }],
        if: "false",
        lifeCycle: undefined,
        permissionsPreCheck: null,
        alias: "brick-a",
        // Ignore `injectDeep`
        injectDeep: true,
      },
      {
        brick: "m",
        if: false,
        iid: "instance-b01",
        lifeCycle: undefined,
        permissionsPreCheck: undefined,
        alias: "brick-a",
      },
      0,
    ],
    [
      {
        id: "R-02",
        instanceId: "instance-r02",
        path: "/b",
        if: null,
        type: "routes",
        permissionsPreCheck: "*",
      },
      {
        permissionsPreCheck: undefined,
        path: "/b",
        type: "routes",
        iid: "instance-r02",
      },
      1,
    ],
    [
      {
        id: "R-02",
        instanceId: "instance-r02",
        path: "/b",
        if: "",
        type: "routes",
        providers: "*",
      },
      {
        providers: undefined,
        path: "/b",
        type: "routes",
        iid: "instance-r02",
      } as RouteConf,
      1,
    ],
    [
      {
        id: "B-T-01",
        instanceId: "a",
        templateId: "tpl-01",
        type: "custom-template",
      },
      null,
      0,
    ],
  ])(
    "should normalize a builder node",
    (builderNode, conf, consoleErrorCalledTimes) => {
      expect(normalizeBuilderNode(builderNode)).toEqual(conf);
      expect(consoleError).toHaveBeenCalledTimes(consoleErrorCalledTimes);
    }
  );
});
