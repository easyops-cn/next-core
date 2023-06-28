import {
  devtoolsHookEmit,
  FRAME_ACTIVE_CHANGE,
  listenDevtoolsEagerly,
  MESSAGE_SOURCE_PANEL,
  PANEL_CHANGE,
} from "./devtools.js";

const emit = jest.fn();
(window as any).__BRICK_NEXT_DEVTOOLS_HOOK__ = { emit };

describe("devtools", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    listenDevtoolsEagerly();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test("basic", () => {
    devtoolsHookEmit("evaluation", "01");

    jest.advanceTimersByTime(1);

    expect(emit).toHaveBeenNthCalledWith(1, {
      type: "evaluation",
      payload: "01",
    });

    // Toggle panel
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          source: MESSAGE_SOURCE_PANEL,
          payload: {
            type: PANEL_CHANGE,
            panel: "Bricks",
          },
        },
      })
    );

    devtoolsHookEmit("evaluation", "02");
    jest.advanceTimersByTime(1);
    expect(emit).toBeCalledTimes(1);

    // Toggle active
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          source: MESSAGE_SOURCE_PANEL,
          payload: {
            type: FRAME_ACTIVE_CHANGE,
            active: false,
          },
        },
      })
    );

    // No data
    window.dispatchEvent(new MessageEvent("message"));

    devtoolsHookEmit("evaluation", "03");
    jest.advanceTimersByTime(1);
    expect(emit).toBeCalledTimes(1);
  });
});
