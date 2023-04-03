import { describe, test, expect } from "@jest/globals";
import { asyncComputeRealValue, computeRealValue } from "./computeRealValue.js";
import type { RuntimeContext } from "../interfaces.js";

const query = new URLSearchParams("q=foo");
const runtimeContext = {
  data: {
    quality: "good",
  },
  query,
} as RuntimeContext;
const runtimeContextWithNoData = { query } as RuntimeContext;

describe("asyncComputeRealValue", () => {
  test("useBrick", async () => {
    expect(
      await asyncComputeRealValue(
        {
          header: {
            useBrick: {
              brick: "div",
              properties: {
                label: "@{quality},${QUERY.q}",
              },
            },
          },
        },
        runtimeContext
      )
    ).toEqual({
      header: {
        useBrick: {
          brick: "div",
          properties: {
            label: "good,foo",
          },
        },
      },
    });
  });

  test("useBrick with no inject", async () => {
    expect(
      await asyncComputeRealValue(
        {
          header: {
            useBrick: {
              brick: "div",
              properties: {
                label: "@{quality},${QUERY.q}",
              },
            },
          },
        },
        runtimeContext,
        { noInject: true }
      )
    ).toEqual({
      header: {
        useBrick: {
          brick: "div",
          properties: {
            label: "good,${QUERY.q}",
          },
        },
      },
    });
  });

  test("useBrick with no data and no inject", async () => {
    expect(
      await asyncComputeRealValue(
        {
          header: {
            useBrick: {
              brick: "div",
              properties: {
                label: "@{quality},${QUERY.q}",
              },
            },
          },
        },
        runtimeContextWithNoData,
        { noInject: true }
      )
    ).toEqual({
      header: {
        useBrick: {
          brick: "div",
          properties: {
            label: "@{quality},${QUERY.q}",
          },
        },
      },
    });
  });

  test("useBrick with no data", async () => {
    expect(
      await asyncComputeRealValue(
        {
          header: {
            useBrick: {
              brick: "div",
              properties: {
                label: "@{quality},${QUERY.q}",
              },
            },
          },
        },
        runtimeContextWithNoData
      )
    ).toEqual({
      header: {
        useBrick: {
          brick: "div",
          properties: {
            label: "@{quality},foo",
          },
        },
      },
    });
  });

  test("lazy useBrick", async () => {
    expect(
      await asyncComputeRealValue(
        {
          header: {
            useBrick: {
              brick: "div",
              properties: {
                label: "@{quality},${QUERY.q}",
              },
            },
          },
        },
        runtimeContext,
        { $$lazyForUseBrick: true }
      )
    ).toEqual({
      header: {
        useBrick: {
          brick: "div",
          properties: {
            label: "@{quality},${QUERY.q}",
          },
        },
      },
    });
  });
});

describe("computeRealValue", () => {
  test("useBrick with legacy transform", () => {
    expect(
      computeRealValue(
        {
          header: {
            useBrick: {
              brick: "div",
              transform: {
                label: "@{quality},${QUERY.q}",
              },
              [Symbol.for("test")]: "bar",
            },
          },
        },
        runtimeContext
      )
    ).toEqual({
      header: {
        useBrick: {
          brick: "div",
          transform: {
            label: "good,foo",
          },
          [Symbol.for("test")]: "bar",
        },
      },
    });
  });

  test("useBrick with legacy transform and ignore symbols", () => {
    expect(
      computeRealValue(
        {
          header: {
            useBrick: {
              brick: "div",
              transform: {
                label: "@{quality},${QUERY.q}",
              },
              [Symbol.for("test")]: "bar",
            },
          },
        },
        runtimeContext,
        { ignoreSymbols: true }
      )
    ).toEqual({
      header: {
        useBrick: {
          brick: "div",
          transform: {
            label: "good,foo",
          },
        },
      },
    });
  });

  test("useBrick with legacy transform with no data", () => {
    expect(
      computeRealValue(
        {
          header: {
            useBrick: {
              brick: "div",
              transform: {
                label: "@{quality},${QUERY.q}",
              },
            },
          },
        },
        runtimeContextWithNoData
      )
    ).toEqual({
      header: {
        useBrick: {
          brick: "div",
          transform: {
            label: "@{quality},foo",
          },
        },
      },
    });
  });

  test("useBrick with legacy transform with no data and no inject", () => {
    expect(
      computeRealValue(
        {
          header: {
            useBrick: {
              brick: "div",
              transform: {
                label: "@{quality},${QUERY.q}",
              },
            },
          },
        },
        runtimeContextWithNoData,
        { noInject: true }
      )
    ).toEqual({
      header: {
        useBrick: {
          brick: "div",
          transform: {
            label: "@{quality},${QUERY.q}",
          },
        },
      },
    });
  });

  test("lazy useBrick with legacy transform", () => {
    expect(
      computeRealValue(
        {
          header: {
            useBrick: {
              brick: "div",
              transform: {
                label: "@{quality},${QUERY.q}",
              },
            },
          },
        },
        runtimeContext,
        { $$lazyForUseBrick: true }
      )
    ).toEqual({
      header: {
        useBrick: {
          brick: "div",
          transform: {
            label: "@{quality},${QUERY.q}",
          },
        },
      },
    });
  });
});
