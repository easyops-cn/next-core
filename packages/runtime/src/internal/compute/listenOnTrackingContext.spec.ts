import {
  listenOnTrackingContext,
  TrackingContextItem,
} from "./listenOnTrackingContext.js";
import type { RuntimeBrick, RuntimeContext } from "../interfaces.js";
import { DataStore } from "../data/DataStore.js";

const ctxStore = new DataStore("CTX");
const tplStateStoreMap = new Map<string, DataStore<"STATE">>();
const stateStore = new DataStore("STATE");
const tplStateStoreId = "tpl-state-0";
tplStateStoreMap.set(tplStateStoreId, stateStore);
const formStateStoreMap = new Map<string, DataStore<"FORM_STATE">>();
const formStore = new DataStore("FORM_STATE");
const formStateStoreId = "form-state-0";
formStateStoreMap.set(formStateStoreId, formStore);

const runtimeContext = {
  ctxStore,
  tplStateStoreId,
  tplStateStoreMap,
  formStateStoreId,
  formStateStoreMap,
} as Partial<RuntimeContext> as RuntimeContext;

ctxStore.define(
  [
    {
      name: "hello",
      value: "Hello",
    },
    {
      name: "world",
    },
  ],
  runtimeContext
);

stateStore.define(
  [
    {
      name: "hola",
    },
  ],
  runtimeContext
);

formStore.define(
  [
    {
      name: "good",
    },
  ],
  runtimeContext
);

describe("listenOnTrackingContext", () => {
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
      formStateNames: ["good"],
      propName: "textContent",
      propValue: "<% 'track formstate', FORM_STATE.good %>",
    },
  ];

  it("should update brick properties when context changed", () => {
    const brick: RuntimeBrick = {
      element: document.createElement("div"),
      type: "div",
      runtimeContext,
    };
    listenOnTrackingContext(brick, trackingContextList);
    ctxStore.updateValue("world", "World", "replace");
    expect(brick.element?.title).toBe("HelloWorld");
  });

  it("should update brick properties when tpl state changed", () => {
    const brick: RuntimeBrick = {
      element: document.createElement("div"),
      type: "div",
      runtimeContext,
    };
    listenOnTrackingContext(brick, trackingContextList);
    stateStore.updateValue("hola", "Hola", "replace");
    expect(brick.element?.textContent).toBe("Hola");
  });

  it("should update brick properties when form state changed", () => {
    const brick: RuntimeBrick = {
      element: document.createElement("div"),
      type: "div",
      runtimeContext,
    };
    listenOnTrackingContext(brick, trackingContextList);
    formStore.updateValue("good", "Better", "replace");
    expect(brick.element?.textContent).toBe("Better");
  });

  it("should do nothing if brick has no element when context changed", () => {
    const brick: RuntimeBrick = {
      type: "div",
      runtimeContext,
    };
    listenOnTrackingContext(brick, trackingContextList);
    ctxStore.updateValue("world", "Oops", "replace");
  });
});
