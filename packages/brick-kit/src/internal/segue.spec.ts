import { MicroApp, SeguesConf } from "@next-core/brick-types";
import { getUrlBySegueFactory } from "./segue";

describe("getUrlBySegueFactory", () => {
  describe("getUrlBySegueFactory should work", () => {
    const app = {
      homepage: "/segue-home",
      $$routeAliasMap: new Map([
        [
          "segue-target-a",
          {
            path: "${APP.homepage}/segue-target-a",
            alias: "segue-target-a",
          },
        ],
        [
          "segue-target-b",
          {
            path: "${APP.homepage}/segue-target-b/:id",
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
      ["testSegueIdA", undefined, undefined, "/segue-home/segue-target-a"],
      [
        "testSegueIdA",
        undefined,
        {
          for: "good",
        },
        "/segue-home/segue-target-a?for=good",
      ],
      [
        "testSegueIdA",
        undefined,
        {
          shouldIgnore: null,
        },
        "/segue-home/segue-target-a",
      ],
      [
        "testSegueIdB",
        {
          id: "quality",
        },
        undefined,
        "/segue-home/segue-target-b/quality",
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
        "/segue-home/segue-target-b/quality?for=good&for=better",
      ],
    ])(
      "getUrlBySegueFactory(...)('%js', %j, %j) should return '%s'",
      (segueId, pathParams, query, url) => {
        expect(
          getUrlBySegueFactory(app, segues)(segueId, pathParams, query)
        ).toEqual(url);
      }
    );

    it("getUrlBySegueFactory should throw if segue not found", () => {
      expect(() => {
        getUrlBySegueFactory(app, segues)("testSegueIdC");
      }).toThrow();
    });

    it("getUrlBySegueFactory should throw if route alias not found", () => {
      expect(() => {
        getUrlBySegueFactory(
          {
            $$routeAliasMap: new Map([]),
          } as MicroApp,
          segues
        )("testSegueIdA");
      }).toThrow();
    });
  });
});
