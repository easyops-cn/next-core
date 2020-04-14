import { MicroApp, SeguesConf } from "@easyops/brick-types";
import { getUrlFactory } from "./segue";

describe("getUrlFactory", () => {
  describe("getUrlFactory should work", () => {
    const app = {
      $$routeAliasMap: new Map([
        [
          "segue-target-a",
          {
            path: "/segue-target-a",
            alias: "segue-target-a",
          },
        ],
        [
          "segue-target-b",
          {
            path: "/segue-target-b/:id",
            alias: "segue-target-b",
          },
        ],
      ]),
    } as MicroApp;
    const segues: SeguesConf = {
      testSegueIdA: {
        target: "segue-target-a",
      },
      testSegueIdB: {
        target: "segue-target-b",
      },
    };

    it.each<[string, Record<string, any>, Record<string, any>, string]>([
      ["testSegueIdA", undefined, undefined, "/segue-target-a"],
      [
        "testSegueIdA",
        undefined,
        {
          for: "good",
        },
        "/segue-target-a?for=good",
      ],
      [
        "testSegueIdA",
        undefined,
        {
          shouldIgnore: null,
        },
        "/segue-target-a",
      ],
      [
        "testSegueIdB",
        {
          id: "quality",
        },
        undefined,
        "/segue-target-b/quality",
      ],
      [
        "testSegueIdB",
        {
          id: "quality",
        },
        {
          for: ["good", "better"],
          shouldIgnore: null,
        },
        "/segue-target-b/quality?for=good&for=better",
      ],
    ])(
      "getUrlFactory(...)('%js', %j, %j) should return '%s'",
      (segueId, pathParams, query, url) => {
        expect(getUrlFactory(app, segues)(segueId, pathParams, query)).toEqual(
          url
        );
      }
    );

    it("getUrlFactory should throw if segue not found", () => {
      expect(() => {
        getUrlFactory(app, segues)("testSegueIdC");
      }).toThrow();
    });

    it("getUrlFactory should throw if route alias not found", () => {
      expect(() => {
        getUrlFactory(
          {
            $$routeAliasMap: new Map([]),
          } as MicroApp,
          segues
        )("testSegueIdA");
      }).toThrow();
    });
  });
});
