import {
  expandCustomTemplate,
  registerCustomTemplate,
  getTagNameOfCustomTemplate,
  handleProxyOfCustomTemplate,
} from "./CustomTemplates";
import { RuntimeBrick } from "./BrickNode";
import * as runtime from "./Runtime";

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
              ],
            },
          },
        },
      ],
    });
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
      proxyBrick
    );

    expect(expanded).toMatchSnapshot();
    expect(proxyBrick).toMatchSnapshot();
  });
});

describe("handleProxyOfCustomTemplate", () => {
  it("should handleProxyOfCustomTemplate for no proxy", () => {
    expect(() => {
      handleProxyOfCustomTemplate({});
      handleProxyOfCustomTemplate({
        proxy: {},
      });
      handleProxyOfCustomTemplate({
        proxy: {},
        proxyRefs: new Map(),
      });
      handleProxyOfCustomTemplate({
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
          },
          events: {
            "button.click": {
              ref: "button",
              refEvent: "general.button.click",
            },
          },
          methods: {
            tell: {
              ref: "button",
              refMethod: "tellStory",
            },
          },
        },
        proxyRefs: new Map(),
      });
    }).not.toThrow();
  });

  it("should handleProxyOfCustomTemplate", () => {
    const templateElement = document.createElement("div") as any;
    const button = document.createElement("div") as any;
    const microView = document.createElement("div") as any;

    button.buttonName = "original button name";
    button.buttonType = "default";
    button.style.display = "block";
    button.tellStory = jest.fn();
    microView.noGap = false;
    templateElement.dispatchEvent = jest.fn();

    const brick: RuntimeBrick = {
      element: templateElement,
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
        },
        events: {
          "button.click": {
            ref: "button",
            refEvent: "general.button.click",
          },
        },
        methods: {
          tell: {
            ref: "button",
            refMethod: "tellStory",
          },
        },
      },
      proxyRefs: new Map([
        [
          "button",
          {
            brick: {
              element: button,
            },
          },
        ],
        [
          "micro-view",
          {
            brick: {
              element: microView,
            },
          },
        ],
      ]),
    };
    handleProxyOfCustomTemplate(brick);

    // Changed prop in proxy.
    expect(templateElement.button).toEqual("original button name");
    templateElement.button = "new button name";
    expect(templateElement.button).toEqual("new button name");
    expect(button.buttonName).toEqual("new button name");

    // Same prop name as proxy.
    expect(templateElement.noGap).toEqual(false);
    templateElement.noGap = true;
    expect(templateElement.noGap).toEqual(true);
    expect(microView.noGap).toEqual(true);

    // Changed transformable prop in proxy.
    expect(templateElement.isDanger).toEqual(undefined);
    templateElement.isDanger = true;
    expect(templateElement.isDanger).toEqual(true);
    expect(button.buttonType).toEqual("danger");
    expect(button.style.display).toEqual("inline");

    // Invoke a method.
    templateElement.tell("good", "story");
    expect(button.tellStory).toBeCalledWith("good", "story");

    // Dispatch an event.
    button.dispatchEvent(
      new CustomEvent("general.button.click", {
        detail: "oops!",
        cancelable: true,
      })
    );
    const lastCallEvent = templateElement.dispatchEvent.mock.calls[0][0];
    expect(lastCallEvent.type).toBe("button.click");
    expect(lastCallEvent.detail).toBe("oops!");
    expect(lastCallEvent.cancelable).toBe(true);
    expect(lastCallEvent.bubbles).toBe(false);
    expect(lastCallEvent.composed).toBe(false);
  });
});
