import { PluginRuntimeContext } from "@next-core/brick-types";
import { RuntimeBrick } from "../core/BrickNode";
import {
  listenOnTrackingContext,
  TrackingContextItem,
} from "./listenOnTrackingContext";
import * as runtime from "../core/Runtime";
import { CustomTemplateContext } from "../core/CustomTemplates/CustomTemplateContext";

const mockCurrentContext = jest.spyOn(runtime, "_internalApiGetCurrentContext");
const tplContext = new CustomTemplateContext({});
const eventTargetOfHola = new EventTarget();
tplContext.state.set("hola", {
  type: "free-variable",
  value: "Hola",
  eventTarget: eventTargetOfHola,
});

describe("listenOnTrackingContext", () => {
  const eventTargetOfHello = new EventTarget();
  const context: PluginRuntimeContext = {
    storyboardContext: new Map([
      [
        "hello",
        {
          type: "free-variable",
          value: "Hello",
          eventTarget: eventTargetOfHello,
        },
      ],
      [
        "world",
        {
          type: "free-variable",
          value: "World",
        },
      ],
    ]),
    tplContextId: tplContext.id,
  } as PluginRuntimeContext;
  const trackingContextList: TrackingContextItem[] = [
    {
      contextNames: ["hello", "world"],
      stateNames: false,
      propName: "title",
      propValue: "<% 'track context', CTX.hello + CTX.world %>",
    },
    {
      contextNames: false,
      stateNames: ["hola"],
      propName: "textContent",
      propValue: "<% 'track state', STATE.hola %>",
    },
  ];

  beforeEach(() => {
    mockCurrentContext.mockReturnValue(context);
  });

  it("should update brick properties when context changed", () => {
    const brick: RuntimeBrick = {
      element: document.createElement("div"),
    };
    listenOnTrackingContext(brick, trackingContextList, context);
    eventTargetOfHello.dispatchEvent(new CustomEvent("context.change"));
    expect(brick.element.title).toBe("HelloWorld");
  });

  it("should update brick properties when tpl state changed", () => {
    const brick: RuntimeBrick = {
      element: document.createElement("div"),
    };
    listenOnTrackingContext(brick, trackingContextList, context);
    eventTargetOfHola.dispatchEvent(new CustomEvent("state.change"));
    expect(brick.element.textContent).toBe("Hola");
  });

  it("should do nothing if brick has no element when context changed", () => {
    const brick: RuntimeBrick = {};
    listenOnTrackingContext(brick, trackingContextList, context);
    eventTargetOfHello.dispatchEvent(new CustomEvent("context.change"));
    expect(brick).toEqual({});
  });
});
