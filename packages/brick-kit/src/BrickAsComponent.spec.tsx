import React from "react";
import { mount } from "enzyme";
import ReactDOM from "react-dom";
import {
  BrickConf,
  BrickEventHandler,
  RuntimeBrickElement,
} from "@next-core/brick-types";
import * as listenerUtils from "./internal/bindListeners";
import {
  BrickAsComponent,
  ForwardRefSingleBrickAsComponent,
} from "./BrickAsComponent";
import * as runtime from "./core/Runtime";
import * as transformProperties from "./transformProperties";
import { registerCustomTemplate } from "./core/exports";

const bindListeners = jest.spyOn(listenerUtils, "bindListeners");
const spiedListenerFactory = jest
  .spyOn(listenerUtils, "listenerFactory")
  .mockImplementation(() => jest.fn());
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
const currentContext = {
  hash: "#test",
  app: {
    id: "steve-test",
  },
};
jest
  .spyOn(runtime, "_internalApiGetCurrentContext")
  .mockReturnValue(currentContext as any);
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
        tplArgument: {
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
                lifeCycle: {
                  useResolves: [
                    {
                      useProvider: "my.provider",
                      args: ["<% TPL.tplArgument %>"],
                    },
                  ],
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
                          textContent: "in tpl outside slots",
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
    expect(spyOnResolve.mock.calls[0][2]).toEqual(currentContext);
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
            tplArgument: "test",
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
    expect(spyOnResolve.mock.calls[0][2]).toEqual({
      ...currentContext,
      tplContextId: "tpl-ctx-1",
    });
    expect(wrapper.html()).toBe(
      "<steve-test.tpl-custom-template>" +
        '<basic-bricks.micro-view slot="">' +
        '<div id="refPropertiesName" slot="content" style="display: block; color: rgb(245, 245, 245);">refName</div>' +
        '<div id="tplPropertiesName" slot="content" style="color: rgb(245, 245, 245);" title="resolved">tplName</div>' +
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
    expect(consoleLog).toHaveBeenNthCalledWith(1, "source", expect.anything());
    expect(consoleLog).toHaveBeenNthCalledWith(2, "refClick");

    // in tpl proxy event
    const inTplElement = wrapperElement.querySelector("#inTplRef");
    inTplElement.dispatchEvent(
      new CustomEvent("click", {
        detail: "mock click form inTplElement",
      })
    );
    expect(consoleLog).toHaveBeenCalledTimes(3);
    expect(consoleLog).toHaveBeenNthCalledWith(3, "source", expect.anything());

    // in tpl outside slot proxy event
    const inTplOutsideSlotElement =
      wrapperElement.querySelector("#tplOutsideSlotRef");
    inTplOutsideSlotElement.dispatchEvent(
      new CustomEvent("click", {
        detail: "mock click form in tpl outside slot element",
      })
    );
    expect(consoleLog).toHaveBeenCalledTimes(4);
    expect(consoleLog).toHaveBeenNthCalledWith(4, "tplOutsideSlotClick");
  });

  it("should work with onMount/onUnmount life cycle", async () => {
    const onMountHandlers: BrickEventHandler[] = [
      {
        action: "console.log",
        args: ["mount"],
      },
    ];
    const onUnmountHandlers: BrickEventHandler[] = [
      {
        action: "console.log",
        args: ["unmount"],
      },
    ];
    const useBrick = {
      brick: "div",
      lifeCycle: { onMount: onMountHandlers, onUnmount: onUnmountHandlers },
    };
    const wrapper = mount(<BrickAsComponent useBrick={useBrick} />);

    await (global as any).flushPromises();
    onMountHandlers.map((handler) => {
      expect(spiedListenerFactory).toBeCalledWith(
        handler,
        currentContext,
        expect.objectContaining(useBrick)
      );
      const mockListener = spiedListenerFactory.mock.results[0].value;
      expect(mockListener).toBeCalledWith(
        expect.objectContaining({ type: "mount" })
      );
      expect(mockListener).not.toBeCalledWith(
        expect.objectContaining({ type: "unmount" })
      );
    });

    wrapper.unmount();
    await (global as any).flushPromises();
    onUnmountHandlers.map((handler) => {
      expect(spiedListenerFactory).toBeCalledWith(
        handler,
        currentContext,
        expect.objectContaining(useBrick)
      );
      const mockListener = spiedListenerFactory.mock.results[1].value;
      expect(mockListener).toBeCalledWith(
        expect.objectContaining({ type: "unmount" })
      );
    });
  });

  it("should work for custom-form", async () => {
    const formData = {
      formSchema: {
        instanceId: "5e95351dd8a41",
        id: "form_233",
        brick: "forms.general-form",
        properties: {
          valueTypes: {},
          id: "form_233",
          previewConf: "undefined",
          values: {},
        },
        mountPoint: "",
        events: {},
        sort: 0,
        if: true,
        isRoot: true,
        bricks: [
          {
            instanceId: "5e95351dd87e9",
            id: "c1",
            brick: "forms.general-switch",
            properties: {
              brickId: "fb-switch",
              id: "c1",
              label: "c1",
              showIcon: false,
            },
            mountPoint: "items",
            events: {},
            sort: 1,
            if: true,
            isRoot: false,
          },
          {
            instanceId: "5e95351dd884d",
            id: "c2",
            brick: "forms.general-select",
            properties: {
              mode: "multiple",
              accordanceOption: false,
              options: [
                {
                  label: "a",
                  value: "a",
                },
              ],
              id: "c2",
              required: false,
              readOnly: false,
              notRender: false,
              label: "c2234",
              inputBoxStyle: {
                width: "100%",
              },
              message: {},
              name: "c2",
              brickId: "fb-multi-select",
            },
            mountPoint: "items",
            events: {},
            sort: 2,
            if: true,
            isRoot: false,
          },
        ],
      },
      fields: [
        {
          instanceId: "5e94f76340171",
          fieldId: "c1",
          name: "c1",
          fieldType: "STRING",
          description: "",
          limit: ["READONLY"],
          defaultValue: "",
        },
        {
          instanceId: "5e94f798ec595",
          fieldId: "c2",
          name: "c2",
          fieldType: "ENUMS",
          description: "",
          limit: [],
          defaultValue: "",
        },
        {
          instanceId: "5e94fb118c62e",
          fieldId: "c6",
          name: "c6",
          fieldType: "STRING",
          description: "",
          limit: [],
          defaultValue: "",
        },
      ],
      context: [
        {
          name: "options",
          value: ["APP", "n"],
        },
      ],
    };
    const wrapper = mount(
      <BrickAsComponent
        useBrick={{
          brick: "form-renderer.form-renderer",
          properties: {
            formData,
          },
        }}
      />
    );
    await (global as any).flushPromises();
    expect(wrapper.html()).toBe(
      "<div>" +
        '<basic-bricks.micro-view style="padding: 12px;" slot="">' +
        '<forms.general-form data-iid="5e95351dd8a41" id="form_233" slot="content">' +
        '<forms.general-switch data-iid="5e95351dd87e9" id="c1" data-testid="c1" slot="items"></forms.general-switch>' +
        '<forms.general-select data-iid="5e95351dd884d" id="c2" data-testid="c2" slot="items"></forms.general-select>' +
        "</forms.general-form></basic-bricks.micro-view></div>"
    );
  });

  it("should work for custom-form with string formdata", async () => {
    const formData = {
      formSchema: {
        instanceId: "5e95351dd8a41",
        id: "form_233",
        brick: "forms.general-form",
        properties: {
          valueTypes: {},
          id: "form_233",
          previewConf: "undefined",
          values: {},
        },
        mountPoint: "",
        events: {},
        sort: 0,
        if: true,
        isRoot: true,
        bricks: [
          {
            instanceId: "5e95351dd87e9",
            id: "c1",
            brick: "forms.general-switch",
            properties: {
              brickId: "fb-switch",
              id: "c1",
              label: "c1",
              showIcon: false,
            },
            mountPoint: "items",
            events: {},
            sort: 1,
            if: true,
            isRoot: false,
          },
          {
            instanceId: "5e95351dd884d",
            id: "c2",
            brick: "forms.general-select",
            properties: {
              mode: "multiple",
              accordanceOption: false,
              options: "<% FORM_STATE.options %>",
              id: "c2",
              required: false,
              readOnly: false,
              notRender: false,
              label: "c2234",
              inputBoxStyle: {
                width: "100%",
              },
              message: {},
              name: "c2",
              brickId: "fb-multi-select",
            },
            mountPoint: "items",
            events: {},
            sort: 2,
            if: true,
            isRoot: false,
          },
        ],
      },
      fields: [
        {
          instanceId: "5e94f76340171",
          fieldId: "c1",
          name: "c1",
          fieldType: "STRING",
          description: "",
          limit: ["READONLY"],
          defaultValue: "",
        },
        {
          instanceId: "5e94f798ec595",
          fieldId: "c2",
          name: "c2",
          fieldType: "ENUMS",
          description: "",
          limit: [],
          defaultValue: "",
        },
        {
          instanceId: "5e94fb118c62e",
          fieldId: "c6",
          name: "c6",
          fieldType: "STRING",
          description: "",
          limit: [],
          defaultValue: "",
        },
      ],
      context: [
        {
          name: "options",
          value: ["APP", "n"],
        },
      ],
    };
    const wrapper = mount(
      <BrickAsComponent
        useBrick={{
          brick: "form-renderer.form-renderer",
          properties: {
            formData: JSON.stringify(formData),
          },
        }}
      />
    );
    await (global as any).flushPromises();
    expect(wrapper.html()).toBe(
      "<div>" +
        '<basic-bricks.micro-view style="padding: 12px;" slot="">' +
        '<forms.general-form data-iid="5e95351dd8a41" id="form_233" slot="content">' +
        '<forms.general-switch data-iid="5e95351dd87e9" id="c1" data-testid="c1" slot="items"></forms.general-switch>' +
        '<forms.general-select data-iid="5e95351dd884d" id="c2" data-testid="c2" slot="items"></forms.general-select>' +
        "</forms.general-form></basic-bricks.micro-view></div>"
    );
  });
});
