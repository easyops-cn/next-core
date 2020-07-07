import { MicroApp } from "@easyops/brick-types";
import { getUrlByAliasFactory } from "./alias";

describe("getUrlByAliasFactory", () => {
  describe("getUrlByAliasFactory should work", () => {
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
    const getUrlByAlias = getUrlByAliasFactory(app);

    it.each<[string, Record<string, any>, Record<string, any>, string]>([
      ["segue-target-a", undefined, undefined, "/segue-home/segue-target-a"],
      [
        "segue-target-a",
        undefined,
        {
          for: "good",
        },
        "/segue-home/segue-target-a?for=good",
      ],
      [
        "segue-target-a",
        undefined,
        {
          shouldIgnore: null,
        },
        "/segue-home/segue-target-a",
      ],
      [
        "segue-target-b",
        {
          id: "quality",
        },
        undefined,
        "/segue-home/segue-target-b/quality",
      ],
      [
        "segue-target-b",
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
      "getUrlByAlias('%js', %j, %j) should return '%s'",
      (alias, pathParams, query, url) => {
        expect(getUrlByAlias(alias, pathParams, query)).toEqual(url);
      }
    );

    it("getUrlByAlias should throw if route alias not found", () => {
      expect(() => {
        getUrlByAlias("not-existed-alias");
      }).toThrow();
    });
  });
});
