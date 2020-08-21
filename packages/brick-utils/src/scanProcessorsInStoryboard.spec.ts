import { Storyboard, BrickConf } from "@easyops/brick-types";
import {
  scanProcessorsInStoryboard,
  scanProcessorsInAny,
} from "./scanProcessorsInStoryboard";

describe("scanProcessorsInStoryboard", () => {
  it("should work", () => {
    const selfRef: Record<string, any> = {
      quality: "good",
    };
    selfRef.ref = selfRef;
    const storyboard: Storyboard = {
      meta: {
        customTemplates: [
          {
            name: "ct-a",
            bricks: [
              {
                brick: "b-x",
                bg: true,
                properties: {
                  any: "<% PROCESSORS.one.doGood() %>",
                  notRelevant: "<% some.any %>",
                  bad: "PROCESSORS.one.doBad()",
                  bad2: "<% PROCESSORS['one'].doBad() %>",
                  bad3: "<% PROCESSORS.one['doBad']() %>",
                  worse: "<% PROCESSORS.one[doBad]() %>",
                  worse2: "<% PROCESSORS[one].doBad() %>",
                  evenWorse: "<% walk(PROCESSORS.one, 'doBad') %>",
                },
              },
            ],
          },
        ],
      },
      routes: [
        {
          if: "<% PROCESSORS.one.doBetter() %>",
          bricks: [
            {
              brick: "b-a",
              properties: {
                any: "<% DATA |> PROCESSORS.two.doEvenBetter %>",
                recursive:
                  "<% PROCESSORS.one.doGood(PROCESSORS.two.doRecursive) %>",
                selfRef,
              },
            },
          ],
        },
      ],
      app: {
        homepage: "<% PROCESSORS.one.doBad() %>",
      },
    } as any;
    expect(scanProcessorsInStoryboard(storyboard).sort()).toEqual([
      "one.doBetter",
      "one.doGood",
      "two.doEvenBetter",
      "two.doRecursive",
    ]);
  });
});

describe("scanProcessorsInAny", () => {
  it("should work", () => {
    const brickConf: BrickConf = {
      brick: "b-b",
      properties: {
        any: "<% PROCESSORS.one.doGood() %>",
      },
    } as any;
    expect(scanProcessorsInAny(brickConf).sort()).toEqual(["one.doGood"]);
  });
});
