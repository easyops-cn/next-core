import { PluginRuntimeContext } from "@next-core/brick-types";
import { RuntimeBrick } from "../core/BrickNode";
import {
  listenOnTrackingContext,
  TrackingContextItem,
} from "./listenOnTrackingContext";
import * as runtime from "../core/Runtime";
import { CustomTemplateContext } from "../core/CustomTemplates/CustomTemplateContext";
import { CustomFormContext } from "../core/CustomForms/CustomFormContext";

const mockCurrentContext = jest.spyOn(runtime, "_internalApiGetCurrentContext");
const tplContext = new CustomTemplateContext({});
const formContext = new CustomFormContext();
const eventTargetOfHola = new EventTarget();
tplContext.state.set("hola", {
  type: "free-variable",
  value: "Hola",
  eventTarget: eventTargetOfHola,
});
formContext.formState.set("hello", {
  type: "free-variable",
  value: "hello",
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
    formContextId: formContext.id,
  } as PluginRuntimeContext;
  const trackingContextList: TrackingContextItem[] = [
    {
      contextNames: ["hello", "world"],
      stateNames: false,
      propName: "title",
      formStateNames: false,
      propValue: "<% 'track context', CTX.hello + CTX.world %>",
    },
    {
      contextNames: false,
      stateNames: ["hola"],
      formStateNames: false,
      propName: "textContent",
      propValue: "<% 'track state', STATE.hola %>",
    },
    {
      contextNames: false,
      stateNames: false,
      formStateNames: ["hello"],
      propName: "textContent",
      propValue: "<% 'track formstate', FORM_STATE.hello %>",
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

  it("should update brick properties when form state changed", () => {
    const brick: RuntimeBrick = {
      element: document.createElement("div"),
    };
    listenOnTrackingContext(brick, trackingContextList, context);
    eventTargetOfHola.dispatchEvent(new CustomEvent("formstate.change"));
    expect(brick.element.textContent).toBe("hello");
  });
});
