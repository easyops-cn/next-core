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
        id: "R-01",
        instanceId: "instance-r01",
        path: "/a",
        type: "bricks",
        parent: [], // Empty parent also works.
        providers: '["p1"]',
        segues: null,
        // Fields should be removed.
        _ts: 123,
        org: 1,
      },
      {
        path: "/a",
        providers: ["p1"],
        segues: undefined,
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
      },
      {
        permissionsPreCheck: ["<% `cmdb:${QUERY.objectId}_instance_create` %>"],
        path: "/b",
        type: "routes",
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
      },
      {
        brick: "m",
        if: false,
        lifeCycle: undefined,
        permissionsPreCheck: undefined,
      },
      0,
    ],
    [
      {
        id: "R-02",
        instanceId: "instance-r02",
        path: "/b",
        type: "routes",
        permissionsPreCheck: "*",
      },
      {
        permissionsPreCheck: undefined,
        path: "/b",
        type: "routes",
      },
      1,
    ],
    [
      {
        id: "R-02",
        instanceId: "instance-r02",
        path: "/b",
        type: "routes",
        providers: "*",
      },
      {
        providers: undefined,
        path: "/b",
        type: "routes",
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
