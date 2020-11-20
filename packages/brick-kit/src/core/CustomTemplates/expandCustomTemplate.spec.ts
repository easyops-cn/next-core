import { RuntimeBrick } from "../BrickNode";
import * as runtime from "../Runtime";
import { CustomTemplateContext } from "./CustomTemplateContext";
import { expandCustomTemplate } from "./expandCustomTemplate";
import { getTagNameOfCustomTemplate } from "./getTagNameOfCustomTemplate";
import { registerCustomTemplate } from "./registerCustomTemplate";

jest.spyOn(runtime, "_internalApiGetCurrentContext").mockReturnValue({} as any);

describe("expandCustomTemplate", () => {
  beforeAll(() => {
    registerCustomTemplate("steve-test.custom-template", {
      proxy: {
        properties: {
          button: {
            ref: "button",
            refProperty: "buttonName",
          },
          noGap: {
            ref: "micro-view",
            refProperty: "noGap",
          },
          isDanger: {
            ref: "button",
            refTransform: {
              buttonType: "<% DATA.isDanger ? 'danger' : 'default' %>",
              style: {
                display: "<% DATA.isDanger ? 'inline' : 'block' %>",
              },
            },
          },
          sharedProp: {
            ref: "button",
            refProperty: "sharedPropOfButton",
            extraOneWayRefs: [
              {
                ref: "input",
                refProperty: "sharedPropOfInput",
              },
              {
                ref: "link",
                refTransform: {
                  sharedPropOfLink: "<% `linked:${DATA.sharedProp}` %>",
                },
              },
              {
                ref: "micro-view",
                refProperty: "sharedPropOfMicroView",
              },
            ],
          },
          appendColumns: {
            ref: "micro-view",
            mergeProperty: "columns",
            mergeType: "array",
            mergeMethod: "append",
          },
        },
        events: {
          "button.click": {
            ref: "button",
            refEvent: "general.button.click",
          },
        },
        slots: {
          tools: {
            ref: "micro-view",
            refSlot: "toolbar",
            refPosition: 0,
          },
          extraContent: {
            ref: "micro-view",
            refSlot: "content",
          },
        },
        methods: {
          tell: {
            ref: "button",
            refMethod: "tellStory",
          },
        },
      },
      bricks: [
        {
          brick: "basic-bricks.micro-view",
          ref: "micro-view",
          properties: {
            pageTitle: "Testing Template",
          },
          slots: {
            content: {
              type: "bricks",
              bricks: [
                {
                  brick: "basic-bricks.general-button",
                  if: null,
                  ref: "button",
                  properties: {
                    buttonType: "dashed",
                  },
                  events: {
                    "general.button.click": {
                      action: "console.log",
                      args: ["source", "${EVENT}"],
                    },
                  },
                },
                {
                  brick: "basic-bricks.general-input",
                  ref: "input",
                },
                {
                  brick: "basic-bricks.general-link",
                  ref: "link",
                },
                {
                  brick: "basic-bricks.brick-in-portal",
                  portal: true,
                },
              ],
            },
          },
        },
      ],
    });
    registerCustomTemplate("steve-test.custom-template-no-proxy", {
      bricks: [
        {
          brick: "basic-bricks.micro-view",
        },
      ],
    });
  });

  it("should define a custom element", () => {
    const tpl = customElements.get("steve-test.custom-template");
    expect((tpl as any)._dev_only_definedProperties).toEqual([
      "button",
      "noGap",
      "isDanger",
      "sharedProp",
      "appendColumns",
    ]);
    expect(tpl.prototype.$$typeof).toBe("custom-template");
  });

  it("should work for getTagNameOfCustomTemplate", () => {
    expect(getTagNameOfCustomTemplate("steve-test.custom-template")).toBe(
      "steve-test.custom-template"
    );
    expect(getTagNameOfCustomTemplate("custom-template", "steve-test")).toBe(
      "steve-test.custom-template"
    );
    expect(getTagNameOfCustomTemplate("steve-test.another-template")).toBe(
      false
    );
  });

  it("should expandCustomTemplate", () => {
    const proxyBrick: RuntimeBrick = {};
    const expanded = expandCustomTemplate(
      {
        brick: "steve-test.custom-template",
        properties: {
          noGap: "${QUERY.gap|bool|not}",
          sharedProp: "shared",
        },
        lifeCycle: {
          useResolves: [
            {
              provider: "providers-of-cmdb\\.cmdb-object-api-get-detail",
              args: ["HOST"],
              transform: {
                button: "@{name}",
              },
            },
          ],
        },
        events: {
          "button.click": {
            action: "console.log",
            args: ["proxied", "${EVENT}"],
          },
        },
        slots: {
          tools: {
            type: "bricks",
            bricks: [
              {
                brick: "div",
                properties: {
                  textContent: "slotted tools!",
                },
              },
            ],
          },
          extraContent: {
            type: "bricks",
            bricks: [
              {
                brick: "div",
                properties: {
                  textContent: "slotted extra content!",
                },
              },
            ],
          },
        },
      },
      proxyBrick,
      {} as any,
      new CustomTemplateContext()
    );

    expect(expanded).toMatchSnapshot();
    expect(proxyBrick).toMatchSnapshot();
  });

  it("should work if proxy is empty", () => {
    const proxyBrick: RuntimeBrick = {};
    const expanded = expandCustomTemplate(
      {
        brick: "steve-test.custom-template-no-proxy",
        properties: {},
        events: {},
      },
      proxyBrick,
      {} as any,
      new CustomTemplateContext()
    );

    expect(expanded).toMatchSnapshot();
    expect(proxyBrick).toMatchSnapshot();
  });
});
