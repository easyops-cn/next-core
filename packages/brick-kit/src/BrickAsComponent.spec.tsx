import React from "react";
import { mount } from "enzyme";
import { BrickConf, RuntimeBrickElement } from "@easyops/brick-types";
import * as listenerUtils from "./bindListeners";
import { BrickAsComponent } from "./BrickAsComponent";
import * as runtime from "./core/Runtime";

const bindListeners = jest.spyOn(listenerUtils, "bindListeners");
const spyOnResolve = jest.fn((_brickConf: BrickConf, brick: any) => {
  brick.properties.title = "resolved";
});
const _internalApiGetRouterState = jest
  .spyOn(runtime, "_internalApiGetRouterState")
  .mockReturnValue("mounted");
jest.spyOn(runtime, "_internalApiGetResolver").mockReturnValue({
  resolve: spyOnResolve,
} as any);
jest.spyOn(runtime, "_internalApiGetCurrentContext").mockReturnValue({} as any);

// Mock a custom element of `custom-existed`.
customElements.define(
  "custom-existed",
  class Tmp extends HTMLElement {
    get $$typeof(): string {
      return "brick";
    }
  }
);

describe("BrickAsComponent", () => {
  afterEach(() => {
    bindListeners.mockClear();
  });

  it("should work", async () => {
    const wrapper = mount(
      <BrickAsComponent
        useBrick={{
          brick: "div",
          transform: "title",
          transformFrom: "tips",
          events: {
            "button.click": {
              action: "console.log",
              args: ["@{tips}"],
            },
          },
        }}
        data={{
          tips: "good",
        }}
      />
    );

    await (global as any).flushPromises();
    const div = wrapper.find("div").getDOMNode() as HTMLDivElement;
    expect(div.title).toBe("good");
    expect(bindListeners.mock.calls[0][1]).toEqual({
      "button.click": {
        action: "console.log",
        args: ["good"],
      },
    });
    expect((div as RuntimeBrickElement).$$typeof).toBe("native");
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
});
