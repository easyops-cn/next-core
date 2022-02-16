import React from "react";
import { mount } from "enzyme";
import ReactDOM from "react-dom";
import { BrickConf, RuntimeBrickElement } from "@next-core/brick-types";
import * as listenerUtils from "./internal/bindListeners";
import {
  BrickAsComponent,
  ForwardRefSingleBrickAsComponent,
  handleProxyOfParentTemplate,
} from "./BrickAsComponent";
import * as runtime from "./core/Runtime";
import * as transformProperties from "./transformProperties";
import { registerCustomTemplate } from "./core/exports";
import { CustomTemplateContext } from "./core/CustomTemplates/CustomTemplateContext";
import { RuntimeBrick } from "./core/BrickNode";

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
const consoleLog = jest.spyOn(console, "log").mockImplementation(() => void 0);
jest.spyOn(runtime, "_internalApiGetResolver").mockReturnValue({
  resolve: spyOnResolve,
} as any);
jest.spyOn(runtime, "_internalApiGetCurrentContext").mockReturnValue({
  hash: "#test",
  app: {
    id: "steve-test",
  },
} as any);
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
        // TODO: deep DOM wasn't show?
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
          }}
          data={{
            textContent: "hello world",
          }}
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
        refPropertiesName: {
          ref: "refPropertiesName",
          refProperty: "textContent",
        },
        tplPropertiesName: {
          asVariable: true,
        },
        slotToolDivContent: {
          asVariable: true,
        },
        refStyleIsInline: {
          ref: "refPropertiesName",
          refTransform: {
            style: {
              display: "<% DATA.refStyleIsInline ? 'inline' : 'block' %>",
            },
          },
        },
        sharedProp: {
          ref: "refPropertiesName",
          refProperty: "style.color",
          extraOneWayRefs: [
            {
              ref: "tplPropertiesName",
              refProperty: "style.color",
            },
          ],
        },
        defaultSlotContentShow: {
          asVariable: true,
        },
        defaultSlotContentText: {
          ref: "defaultTplSlotRef-show",
          refProperty: "textContent",
        },
        inTplRefPropertyContent: {
          asVariable: true,
        },
        inTplRefPropertyStyle: {
          asVariable: true,
        },
        tplOutsideSlotContent: {
          ref: "tplOutsideSlotRef",
          refProperty: "textContent",
        },
      },
      events: {
        refClick: {
          ref: "refPropertiesName",
          refEvent: "click",
        },
        slotRefClick: {
          ref: "defaultTplSlotRef-show",
          refEvent: "click",
        },
        inTplRefEvent: {
          // TODO: ref miss
          ref: "tpl-use-brick-in-template-ref",
          refEvent: "inTplRefEvent",
        },
        tplOutsideSlotClick: {
          ref: "tplOutsideSlotRef",
          refEvent: "click",
        },
      },
      slots: {
        tools: {
          ref: "micro-view",
          refSlot: "toolbar",
          refPosition: 0,
        },
      },
      methods: {
        refTell: {
          ref: "refPropertiesName",
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
                brick: "div",
                if: null,
                ref: "refPropertiesName",
                properties: {
                  id: "refPropertiesName",
                },
                events: {
                  click: {
                    action: "console.log",
                    args: ["source", "${EVENT}"],
                  },
                },
              },
              {
                brick: "div",
                ref: "tplPropertiesName",
                properties: {
                  id: "tplPropertiesName",
                  textContent: "<% TPL.tplPropertiesName %>",
                },
              },
              {
                brick: "tpl-use-brick-in-template",
                // TODO: miss ref ?
                ref: "tpl-use-brick-in-template-ref",
                properties: {
                  inTplRefPropertyContent: "<% TPL.inTplRefPropertyContent %>",
                  inTplRefPropertyStyle: "<% TPL.inTplRefPropertyStyle %>",
                },
                slots: {
                  tplOutsizeSlots: {
                    type: "bricks",
                    bricks: [
                      {
                        brick: "div",
                        ref: "tplOutsideSlotRef",
                        properties: {
                          id: "tplOutsideSlotRef",
                          textContent: "in tpl ouside slots",
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
          toolbar: {
            type: "bricks",
            bricks: [
              {
                brick: "div",
                ref: "defaultTplSlotRef-show",
                if: "<% TPL.defaultSlotContentShow %>",
                properties: {
                  id: "defaultTplSlotRef-show",
                  textContent: "defaultTplSlotRef-show",
                },
              },
            ],
          },
        },
      },
    ],
  });
  registerCustomTemplate("steve-test.tpl-use-brick-in-template", {
    proxy: {
      properties: {
        inTplRefPropertyContent: {
          ref: "inTplRef",
          refProperty: "textContent",
        },
        inTplRefPropertyStyle: {
          asVariable: true,
        },
      },
      events: {
        inTplRefEvent: {
          ref: "inTplRef",
          refEvent: "click",
        },
      },
      slots: {
        tplOutsizeSlots: {
          ref: "micro-view",
          refSlot: "tplOutsizeSlots",
          refPosition: 0,
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
                brick: "div",
                if: null,
                ref: "inTplRef",
                properties: {
                  textContent: "inTplRef",
                  id: "inTplRef",
                  style: "<% TPL.inTplRefPropertyStyle %>",
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
          tplOutsizeSlots: {
            type: "bricks",
            bricks: [
              {
                brick: "div",
                properties: {
                  textContent: "default outsize slots",
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
          iid: "i-1",
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
    expect(div.dataset.iid).toBe("i-1");
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
          iid: "i-2",
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
          properties: {
            refPropertiesName: "refName",
            tplPropertiesName: "tplName",
            refStyleIsInline: false,
            sharedProp: "#f5f5f5",
            slotToolDivContent: "topToolDivContent",
            defaultSlotContentShow: false,
            defaultSlotContentText: "this is default slot content innerHTML",
            inTplRefPropertyContent: "inTplRefContent",
            inTplRefPropertyStyle: {
              color: "#f5f5f5",
            },
            tplOutsideSlotContent:
              "this is tpl outside slot ref content innherHTML",
          },
          events: {
            refClick: {
              action: "console.log",
              args: ["refClick"],
            },
            slotRefClick: {
              action: "console.log",
              args: ["slotRefClick"],
            },
            inTplRefEvent: {
              action: "console.log",
              args: ["inTplRefClick"],
            },
            tplOutsideSlotClick: {
              action: "console.log",
              args: ["tplOutsideSlotClick"],
            },
          },
          slots: {
            tools: {
              type: "bricks",
              bricks: [
                {
                  brick: "div",
                  properties: {
                    id: "toolDiv",
                    ref: "toolDiv",
                    textContent: "<% TPL.slotToolDivContent %>",
                  },
                },
              ],
            },
          },
        }}
        data={{
          buttonName: "good",
        }}
      />
    );
    await (global as any).flushPromises();
    expect(wrapper.html()).toBe(
      "<steve-test.tpl-custom-template>" +
        '<basic-bricks.micro-view slot="">' +
        '<div id="refPropertiesName" slot="content" style="display: block; color: rgb(245, 245, 245);">refName</div>' +
        '<div id="tplPropertiesName" slot="content" style="color: rgb(245, 245, 245);">tplName</div>' +
        '<steve-test.tpl-use-brick-in-template slot="content">' +
        '<basic-bricks.micro-view slot="">' +
        '<div id="inTplRef" style="color: rgb(245, 245, 245);" slot="content">inTplRefContent</div>' +
        '<use-brick-element id="use-brick-element" slot="content">' +
        '<span id="test-1">hello world</span>' +
        "</use-brick-element>" +
        '<div id="tplOutsideSlotRef" slot="tplOutsizeSlots">this is tpl outside slot ref content innherHTML</div>' +
        '<div slot="tplOutsizeSlots">default outsize slots</div>' +
        "</basic-bricks.micro-view>" +
        "</steve-test.tpl-use-brick-in-template>" +
        '<div id="toolDiv" slot="toolbar">[object Object]</div>' +
        "</basic-bricks.micro-view>" +
        "</steve-test.tpl-custom-template>"
    );

    // tpl proxy event
    // @ts-ignore
    const wrapperElement: HTMLElement = wrapper.getDOMNode()[0];
    const refElement = wrapperElement.querySelector("#refPropertiesName");
    refElement.dispatchEvent(
      new CustomEvent("click", {
        detail: "mock click form refElement",
      })
    );
    expect(consoleLog).toHaveBeenCalledTimes(2);

    // in tpl proxy event
    const inTplElement = wrapperElement.querySelector("#inTplRef");
    inTplElement.dispatchEvent(
      new CustomEvent("click", {
        detail: "mock click form inTplElement",
      })
    );
    expect(consoleLog).toHaveBeenCalledTimes(3);

    // in tpl outside slot proxy event
    const inTplOutsideSlotElement =
      wrapperElement.querySelector("#tplOutsideSlotRef");
    inTplOutsideSlotElement.dispatchEvent(
      new CustomEvent("click", {
        detail: "mock click form in tpl outside slot element",
      })
    );
    expect(consoleLog).toHaveBeenCalledTimes(4);
  });

  it("handleProxyOfParentTemplate should work", async () => {
    const buttonElement = document.createElement("div");
    const tplElement = document.createElement("div");
    const brick = {
      bg: false,
      brick: "basic-bricks.general-button",
      element: buttonElement,
      events: {
        "general.button.click": [
          {
            action: "console.log",
            args: ["底层事件"],
          },
        ],
      },
      properties: {},
      ref: "button",
      type: "basic-bricks.general-button",
    };
    const tplBrick: RuntimeBrick = {
      type: "steve-test-only.tpl-steve-test-11",
      element: tplElement,
      properties: {},
      events: {
        buttonClick: [
          {
            action: "console.log",
            args: ["outside button click"],
          },
        ],
      },
      proxy: {
        events: {
          buttonClick: {
            ref: "button",
            refEvent: "general.button.click",
          },
        },
      },
      proxyRefs: new Map<string, unknown>([
        [
          "button",
          {
            brick: "div",
            element: buttonElement,
          },
        ],
      ]),
    };
    const tplContext = new CustomTemplateContext(tplBrick);
    const tplContextId = tplContext.id;
    tplContext.setVariables({});
    listenerUtils.bindListeners(
      buttonElement,
      {
        "general.button.click": [
          {
            action: "console.log",
            args: ["底层事件"],
          },
        ],
      },
      {} as any
    );
    listenerUtils.bindListeners(
      tplElement,
      {
        buttonClick: [
          {
            action: "console.log",
            args: ["outside button click"],
          },
        ],
      },
      {} as any
    );
    handleProxyOfParentTemplate(brick, tplContextId);

    expect((buttonElement as any).$$proxyEvents.length).toBe(1);
    buttonElement.dispatchEvent(
      new CustomEvent("general.button.click", {
        detail: "mock click form buttonElement",
      })
    );
    expect(consoleLog).toBeCalledTimes(2);
  });
});
