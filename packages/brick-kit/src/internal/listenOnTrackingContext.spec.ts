import { PluginRuntimeContext } from "@next-core/brick-types";
import { RuntimeBrick } from "../core/BrickNode";
import {
  listenOnTrackingContext,
  TrackingContextItem,
} from "./listenOnTrackingContext";
import * as runtime from "../core/Runtime";

const mockCurrentContext = jest.spyOn(runtime, "_internalApiGetCurrentContext");

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
  } as PluginRuntimeContext;
  const trackingContextList: TrackingContextItem[] = [
    {
      contextNames: ["hello", "world"],
      propName: "title",
      propValue: "<% 'track context', CTX.hello + CTX.world %>",
    },
    {
      contextNames: ["hola"],
      propName: "message",
      propValue: "<% 'track context', CTX.hola %>",
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

  it("should do nothing if brick has no element when context changed", () => {
    const brick: RuntimeBrick = {};
    listenOnTrackingContext(brick, trackingContextList, context);
    eventTargetOfHello.dispatchEvent(new CustomEvent("context.change"));
    expect(brick).toEqual({});
  });
});
