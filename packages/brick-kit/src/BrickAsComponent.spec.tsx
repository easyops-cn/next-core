import React from "react";
import { mount } from "enzyme";
import ReactDOM from "react-dom";
import { BrickConf, RuntimeBrickElement } from "@next-core/brick-types";
import * as listenerUtils from "./internal/bindListeners";
import {
  BrickAsComponent,
  ForwardRefSingleBrickAsComponent,
} from "./BrickAsComponent";
import * as runtime from "./core/Runtime";
import * as transformProperties from "./transformProperties";
import {
  registerCustomTemplate,
  RuntimeBrickElementWithTplSymbols,
  symbolForParentRefForUseBrickInPortal,
  CustomTemplateContext,
} from "./core/exports";

const bindListeners = jest.spyOn(listenerUtils, "bindListeners");
const spyOnResolve = jest.fn(
  (_brickConf: BrickConf, brick: any, context: any) => {
    brick.properties.title = "resolved";
  }
);
const _internalApiGetRouterState = jest
  .spyOn(runtime, "_internalApiGetRouterState")
  .mockReturnValue("mounted");
const sypOnTransformProperties = jest.spyOn(
  transformProperties,
  "transformProperties"
);
jest.spyOn(runtime, "_internalApiGetResolver").mockReturnValue({
  resolve: spyOnResolve,
} as any);
jest.spyOn(runtime, "_internalApiGetCurrentContext").mockReturnValue({
  hash: "#test",
  app: {
    id: "steve-test",
  },
} as any);
jest
  .spyOn(runtime, "_internalApiGetTplContext")
  .mockReturnValue(new CustomTemplateContext());
const _internalApiLoadDynamicBricksInBrickConf = jest
  .spyOn(runtime, "_internalApiLoadDynamicBricksInBrickConf")
  .mockReturnValue(Promise.resolve());
jest.spyOn(console, "warn").mockImplementation(() => void 0);

// Mock a custom element of `custom-existed`.
customElements.define(
  "custom-existed",
  class Tmp extends HTMLElement {
    get $$typeof(): string {
      return "brick";
    }
  }
);

customElements.define(
  "use-brick-element",
  // MockElement
  class UseBrickElement extends HTMLElement {
    constructor() {
      super();
      ReactDOM.render(
        <BrickAsComponent
          useBrick={{
            brick: "span",
            properties: {
              textContent: "<% DATA.textContent %>",
              id: "test-1",
              useBrick: {
                brick: "b",
                ref: "useBrick-in-useBrick-ref-b",
                properties: {},
              },
            },
            slots: {
              "": {
                type: "bricks",
                bricks: [
                  {
                    brick: "div",
                    properties: {
                      id: "c",
                      textContent: "hello world",
                      useBrick: {
                        brick: "d",
                        ref: "useBrick-slot-useBrick-ref-d",
                        properties: {},
                      },
                    },
                  },
                ],
              },
            },
          }}
          data={{
            textContent: "hello world",
          }}
        />,
        this
      );
    }

    connectedCallback(): void {
      // istanbul ignore else
      if (!this.style.display) {
        this.style.display = "block";
      }
      this._render();
    }

    disconnectedCallback(): void {
      ReactDOM.unmountComponentAtNode(this);
    }

    _render() {
      ReactDOM.render(
        <BrickAsComponent
          useBrick={{
            brick: "span",
            properties: {
              textContent: "div",
              id: "test-1",
              useBrick: {
                brick: "b",
                ref: "useBrick-in-useBrick-ref-b",
                properties: {},
              },
            },
          }}
          data={{}}
        />,
        this
      );
    }
  }
);

beforeAll(() => {
  registerCustomTemplate("steve-test.tpl-custom-template", {
    proxy: {
      properties: {
        button: {
          ref: "button",
          refProperty: "buttonName",
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
                brick: "basic-bricks.general-link",
                ref: "link",
              },
              {
                brick: "use-brick-in-template",
              },
            ],
          },
        },
      },
    ],
  });
  registerCustomTemplate("steve-test.use-brick-in-template", {
    proxy: {},
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
                brick: "div",
                if: null,
                ref: "refDiv",
                properties: {
                  textContent: "refDiv",
                  id: "refDiv",
                },
                events: {
                  click: {
                    action: "console.log",
                    args: ["source", "${EVENT}"],
                  },
                },
              },
              {
                brick: "use-brick-element",
                properties: {
                  id: "use-brick-element",
                },
              },
            ],
          },
        },
      },
    ],
  });
});

describe("BrickAsComponent", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should work", async () => {
    const mockRef = {} as React.RefObject<HTMLElement>;
    const wrapper = mount(
      <BrickAsComponent
        useBrick={{
          brick: "div",
          properties: {
            id: "<% DATA.extraTips %>",
            lang: "@{tips},${HASH}",
            useBrick: {
              brick: "span",
              if: "<% !!DATA.extraTips %>",
              properties: {
                any: "<% DATA.tips %>",
              },
              transform: {
                any: "@{tips}",
              },
              lifeCycle: {
                useResolves: [
                  {
                    useProvider: "my.provider",
                    args: ["<% DATA.extraTips %>"],
                  },
                ],
              },
            },
          },
          transform: {
            title: "@{}",
            accessKey: "${HASH},@{}",
          },
          transformFrom: "tips",
          events: {
            "button.click": {
              action: "console.log",
              args: ["@{tips}", "${HASH}"],
            },
          },
        }}
        data={{
          tips: "good",
          extraTips: "better",
        }}
        parentRefForUseBrickInPortal={mockRef}
      />
    );

    await (global as any).flushPromises();
    expect(_internalApiLoadDynamicBricksInBrickConf).toBeCalled();
    const div = wrapper.find("div").getDOMNode() as HTMLDivElement;
    expect(div.title).toBe("good");
    expect(div.id).toBe("better");
    expect(div.lang).toBe("good,#test");
    expect(div.accessKey).toBe("#test,good");
    expect((div as any).useBrick).toEqual({
      brick: "span",
      // `properties`, `transform`, `events` and `if` of `useBrick` inside
      // the properties of the root brick, are kept and to be transformed lazily.
      if: "<% !!DATA.extraTips %>",
      properties: {
        any: "<% DATA.tips %>",
      },
      transform: {
        any: "@{tips}",
      },
      lifeCycle: {
        useResolves: [
          {
            useProvider: "my.provider",
            args: ["better"],
          },
        ],
      },
    });
    expect(bindListeners.mock.calls[0][1]).toEqual({
      "button.click": {
        action: "console.log",
        args: ["good", "${HASH}"],
      },
    });
    expect((div as RuntimeBrickElement).$$typeof).toBe("native");
    expect(
      (div as RuntimeBrickElementWithTplSymbols)[
        symbolForParentRefForUseBrickInPortal
      ]
    ).toBe(mockRef);
  });

  it("should work for multiple bricks", async () => {
    const wrapper = mount(
      <BrickAsComponent
        useBrick={[
          {
            brick: "custom-existed",
            transform: "title",
            transformFrom: "tips",
          },
          {
            brick: "custom-not-existed",
            transform: "title",
            transformFrom: "tips",
          },
        ]}
        data={{
          tips: "better",
        }}
      />
    );

    await (global as any).flushPromises();
    const existed = wrapper
      .find("custom-existed")
      .getDOMNode() as HTMLDivElement;
    expect(existed.title).toBe("better");
    expect((existed as RuntimeBrickElement).$$typeof).toBe("brick");
    const notExisted = wrapper
      .find("custom-not-existed")
      .getDOMNode() as HTMLDivElement;
    expect(notExisted.title).toBe("better");
    expect((notExisted as RuntimeBrickElement).$$typeof).toBe("invalid");
  });

  it("should work for `if`", async () => {
    const wrapper = mount(
      <BrickAsComponent
        useBrick={[
          {
            brick: "div",
            if: "@{disabled}",
            transform: "title",
            transformFrom: "tips",
          },
          {
            brick: "span",
            if: "@{enabled}",
            transform: "title",
            transformFrom: "tips",
          },
        ]}
        data={{
          tips: "better",
          enabled: true,
          disabled: false,
        }}
      />
    );

    await (global as any).flushPromises();
    const span = wrapper.find("span").getDOMNode() as HTMLDivElement;
    expect(span.title).toBe("better");
    expect(wrapper.find("div").length).toBe(0);
    expect(sypOnTransformProperties).toBeCalledTimes(1);
  });

  it("should work for unsupported `resolvable-if`", async () => {
    const wrapper = mount(
      <BrickAsComponent
        useBrick={[
          {
            brick: "div",
            if: {
              provider: "not-existed",
            } as any,
            transform: "title",
            transformFrom: "tips",
          },
        ]}
        data={{
          tips: "better",
          enabled: true,
          disabled: false,
        }}
      />
    );

    await (global as any).flushPromises();
    const div = wrapper.find("div").getDOMNode() as HTMLDivElement;
    expect(div.title).toBe("better");
  });

  it("should resolve", async () => {
    const wrapper = mount(
      <BrickAsComponent
        useBrick={{
          brick: "div",
          properties: {
            id: "hello",
            style: {
              color: "red",
            },
          },
          transform: "title",
          transformFrom: "tips",
          lifeCycle: {
            useResolves: [
              {
                ref: "my-provider",
              },
            ],
          },
        }}
        data={{
          tips: "good",
        }}
      />
    );
    await (global as any).flushPromises();
    expect(spyOnResolve.mock.calls[0][0]).toEqual({
      brick: "div",
      lifeCycle: {
        useResolves: [
          {
            ref: "my-provider",
          },
        ],
      },
    });
    expect(spyOnResolve.mock.calls[0][1]).toMatchObject({
      type: "div",
      properties: {
        id: "hello",
        style: {
          color: "red",
        },
      },
    });
    expect(spyOnResolve.mock.calls[0][2]).toEqual({
      hash: "#test",
      app: {
        id: "steve-test",
      },
    });
    const div = wrapper.find("div").getDOMNode() as HTMLDivElement;
    expect(div.id).toBe("hello");
    expect(div.title).toBe("resolved");
    expect(div.style.color).toBe("red");

    // Should ignore rendering if router state is initial.
    _internalApiGetRouterState.mockReturnValueOnce("initial");
    wrapper.setProps({
      data: {
        tips: "good",
      },
    });
    await (global as any).flushPromises();
    expect(spyOnResolve).toBeCalledTimes(1);
  });

  it("should work with ForwardRefSingleBrickAsComponent", async () => {
    let ref = null;
    const wrapper = mount(
      <ForwardRefSingleBrickAsComponent
        useBrick={{
          brick: "input",
        }}
        ref={(r) => {
          ref = r;
        }}
      />
    );

    await (global as any).flushPromises();
    expect(wrapper.find("input").instance()).toEqual(ref);
  });

  it("should work with slots", async () => {
    const wrapper = mount(
      <BrickAsComponent
        useBrick={{
          brick: "div",
          slots: {
            content: {
              bricks: [
                {
                  brick: "span",
                  transform: {
                    textContent: "<% DATA.tips %>",
                  },
                },
              ],
            },
            toolbar: {} as any,
          },
        }}
        data={{
          tips: "good",
        }}
      />
    );

    await (global as any).flushPromises();
    const div = wrapper.find("div").getDOMNode() as HTMLDivElement;
    const span = div.firstChild as HTMLSpanElement;
    expect(div.childNodes.length).toBe(1);
    expect(span.tagName).toBe("SPAN");
    expect(span.textContent).toBe("good");
  });

  it("should work for custom-template", async () => {
    const wrapper = mount(
      <BrickAsComponent
        useBrick={{
          brick: "tpl-custom-template",
          properties: {},
        }}
        data={{
          tips: "good",
        }}
      />
    );
    await (global as any).flushPromises();
    expect(wrapper.html()).toBe(
      "<steve-test.tpl-custom-template>" +
        '<basic-bricks.micro-view slot="">' +
        '<basic-bricks.general-button slot="content" style="display: block;"></basic-bricks.general-button>' +
        '<basic-bricks.general-link slot="content"></basic-bricks.general-link>' +
        '<steve-test.use-brick-in-template slot="content">' +
        '<basic-bricks.micro-view slot="">' +
        '<div id="refDiv" slot="content">refDiv</div>' +
        '<use-brick-element id="use-brick-element" slot="content">' +
        '<span id="test-1">hello world</span>' +
        "</use-brick-element>" +
        "</basic-bricks.micro-view>" +
        "</steve-test.use-brick-in-template>" +
        "</basic-bricks.micro-view>" +
        "</steve-test.tpl-custom-template>"
    );
  });
});
