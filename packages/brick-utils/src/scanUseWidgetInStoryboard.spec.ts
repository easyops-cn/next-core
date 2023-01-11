import { Storyboard, BrickConf } from "@next-core/brick-types";
import {
  scanUseWidgetInAny,
  scanUseWidgetInStoryboard,
} from "./scanUseWidgetInStoryboard";

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
                  any: "<% __WIDGET_FN__['a-widget'].getA() %>",
                  good1:
                    "<% STATE.a ? __WIDGET_FN__['b-widget'].getA() : '' %>",
                  notRelevant: "<% some.any %>",
                  bad: "__WIDGET_FN__['bad-widget'].getTest()",
                  bad2: "<% _WIDGET_FN_['bad-widget'].getB() %>",
                  bad3: "<% _WIDGET_FN_.getC()%>",
                  bad4: "<% __WIDGET_FN__.cWidget.getA() %>",
                },
              },
            ],
          },
        ],
      },
      routes: [
        {
          if: "<% __WIDGET_FN__['d-widget'].getA() %>",
          bricks: [
            {
              brick: "b-a",
              properties: {
                any: "<% __WIDGET_FN__['e-widget'].getA() %>",
                selfRef,
              },
            },
          ],
        },
      ],
      app: {
        homepage: "<% __WIDGET_FN__['not-match-app'].getA() %>",
      },
    } as any;
    expect(scanUseWidgetInStoryboard(storyboard).sort()).toEqual([
      "a-widget",
      "b-widget",
      "d-widget",
      "e-widget",
    ]);
  });
});

describe("scanProcessorsInAny", () => {
  it("should work", () => {
    const brickConf: BrickConf = {
      brick: "b-b",
      properties: {
        any: "<% __WIDGET_FN__['a-widget'].getA() %>",
      },
    } as any;
    expect(scanUseWidgetInAny(brickConf).sort()).toEqual(["a-widget"]);
  });
});
