import { describe, test, expect } from "@jest/globals";
import {
  asyncComputeRealProperties,
  computeRealProperties,
  constructAsyncProperties,
} from "./computeRealProperties.js";
import type { RuntimeContext } from "../interfaces.js";
import type { TrackingContextItem } from "./listenOnTrackingContext.js";
import { DataStore } from "../data/DataStore.js";

describe("computeRealProperties", () => {
  test("general", async () => {
    const trackings: TrackingContextItem[] = [];
    const ctxStore = new DataStore("CTX");
    const runtimeContext = { ctxStore } as RuntimeContext;
    ctxStore.define(
      [
        {
          name: "quality",
          value: "good",
        },
      ],
      runtimeContext
    );

    const props = await constructAsyncProperties(
      asyncComputeRealProperties(
        {
          title: "<%= CTX.quality %>",
          style: {
            height: "100%",
          },
          dataset: null,
        },
        runtimeContext,
        trackings
      )
    );
    expect(props).toEqual({
      title: "good",
      style: {
        height: "100%",
      },
    });
  });
});

describe("computeRealProperties", () => {
  test("undefined input", () => {
    const props = computeRealProperties(undefined, null!);
    expect(props).toEqual({});
  });

  test("style and dataset", async () => {
    const ctxStore = new DataStore("CTX");
    const runtimeContext = { ctxStore } as RuntimeContext;
    ctxStore.define(
      [
        {
          name: "quality",
          value: "good",
        },
      ],
      runtimeContext
    );
    await ctxStore.waitForAll();

    const props = computeRealProperties(
      {
        title: "<%= CTX.quality %>",
        style: {
          height: "100%",
        },
        dataset: null,
        useBrick: {
          brick: "div",
        },
      },
      runtimeContext
    );
    expect(props).toEqual({
      title: "good",
      style: {
        height: "100%",
      },
      useBrick: {
        brick: "div",
      },
    });
  });
});
