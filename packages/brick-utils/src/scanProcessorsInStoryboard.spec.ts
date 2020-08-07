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
                  any: "<% PROCESSORS.doGood() %>",
                  notRelevant: "<% some.any %>",
                  bad: "PROCESSORS.doBad()",
                  worse: "<% PROCESSORS['doBad']() %>",
                  evenWorse: "<% walk(PROCESSORS, 'doBad') %>",
                },
              },
            ],
          },
        ],
      },
      routes: [
        {
          if: "<% PROCESSORS.doBetter() %>",
          bricks: [
            {
              brick: "b-a",
              properties: {
                any: "<% DATA |> PROCESSORS.doEvenBetter %>",
                recursive: "<% PROCESSORS.doGood(PROCESSORS.doRecursive) %>",
                selfRef,
              },
            },
          ],
        },
      ],
      app: {
        homepage: "<% PROCESSORS.doBad() %>",
      },
    } as any;
    expect(scanProcessorsInStoryboard(storyboard).sort()).toEqual([
      "doBetter",
      "doEvenBetter",
      "doGood",
      "doRecursive",
    ]);
  });
});

describe("scanProcessorsInAny", () => {
  it("should work", () => {
    const brickConf: BrickConf = {
      brick: "b-b",
      properties: {
        any: "<% PROCESSORS.doGood() %>",
      },
    } as any;
    expect(scanProcessorsInAny(brickConf).sort()).toEqual(["doGood"]);
  });
});
