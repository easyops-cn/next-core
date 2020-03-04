import React from "react";
import { mount } from "enzyme";
import * as listenerUtils from "./bindListeners";
import { BrickConf } from "@easyops/brick-types";
import { BrickAsComponent } from "./BrickAsComponent";
import * as runtime from "./runtime";

const bindListeners = jest.spyOn(listenerUtils, "bindListeners");
const spyOnResolve = jest.fn((_brickConf: BrickConf, brick: any) => {
  brick.properties.title = "resolved";
});
const spyOnProcessBrick = jest.fn((brickConf: BrickConf) => {
  brickConf.brick = `brick-from-${brickConf.template}`;
  delete brickConf.template;
  delete brickConf.params;
});
const _internalApiGetRouterState = jest.fn().mockReturnValue("mounted");
jest.spyOn(runtime, "getRuntime").mockReturnValue({
  _internalApiGetRouterState,
  _internalApiGetResolver: () => ({
    resolve: spyOnResolve,
    processBrick: spyOnProcessBrick
  })
} as any);

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
              args: ["@{tips}"]
            }
          }
        }}
        data={{
          tips: "good"
        }}
      />
    );

    await (global as any).flushPromises();
    const div = wrapper.find("div").getDOMNode() as HTMLDivElement;
    expect(div.title).toBe("good");
    expect(bindListeners.mock.calls[0][1]).toEqual({
      "button.click": {
        action: "console.log",
        args: ["good"]
      }
    });
  });

  it("should work for multiple bricks or templates", async () => {
    const wrapper = mount(
      <BrickAsComponent
        useBrick={[
          {
            brick: "div",
            transform: "title",
            transformFrom: "tips"
          },
          {
            template: "template-a"
          }
        ]}
        data={{
          tips: "better"
        }}
      />
    );

    await (global as any).flushPromises();
    const div = wrapper.find("div").getDOMNode() as HTMLDivElement;
    expect(div.title).toBe("better");
    expect(wrapper.find("brick-from-template-a").length).toBe(1);
  });

  it("should work for `if`", async () => {
    const wrapper = mount(
      <BrickAsComponent
        useBrick={[
          {
            brick: "div",
            if: "@{disabled}",
            transform: "title",
            transformFrom: "tips"
          },
          {
            brick: "span",
            if: "@{enabled}",
            transform: "title",
            transformFrom: "tips"
          }
        ]}
        data={{
          tips: "better",
          enabled: true,
          disabled: false
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
              color: "red"
            }
          },
          transform: "title",
          transformFrom: "tips",
          lifeCycle: {
            useResolves: [
              {
                ref: "my-provider"
              }
            ]
          }
        }}
        data={{
          tips: "good"
        }}
      />
    );
    await (global as any).flushPromises();
    expect(spyOnResolve.mock.calls[0][0]).toEqual({
      brick: "div",
      lifeCycle: {
        useResolves: [
          {
            ref: "my-provider"
          }
        ]
      }
    });
    expect(spyOnResolve.mock.calls[0][1]).toMatchObject({
      type: "div",
      properties: {
        id: "hello",
        style: {
          color: "red"
        }
      }
    });
    const div = wrapper.find("div").getDOMNode() as HTMLDivElement;
    expect(div.id).toBe("hello");
    expect(div.title).toBe("resolved");
    expect(div.style.color).toBe("red");

    // Should ignore rendering if router state is initial.
    _internalApiGetRouterState.mockReturnValueOnce("initial");
    wrapper.setProps({
      data: {
        tips: "good"
      }
    });
    await (global as any).flushPromises();
    expect(spyOnResolve).toBeCalledTimes(1);
  });
});
