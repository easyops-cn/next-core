import { act } from "react-dom/test-utils";
import { listenDevtools } from "./devtools";
import { getMenu } from "./menu";
import {
  TRANSFORMATION_EDIT,
  EVALUATION_EDIT,
  MESSAGE_SOURCE_PANEL,
} from "./devtools";

global.requestIdleCallback = (callback: IdleRequestCallback): number => {
  Promise.resolve().then(() => {
    callback(null);
  });
  return 0;
};

jest.mock("../core/Runtime", () => ({
  _internalApiGetCurrentContext: () => {
    return {
      app: {
        homePage: "/easyops",
      },
      query: {},
      sys: {},
      flags: {},
      hash: {},
      segues: {},
      storyboardContext: new Map(),
    };
  },
}));

describe("devtools", () => {
  beforeEach(() => {
    (window as any).__BRICK_NEXT_DEVTOOLS_HOOK__ = {
      emit: jest.fn(),
      restoreDehydrated: jest.fn((value) => value),
    };
  });

  describe("listenDevtools", () => {
    it.each([
      [
        {
          raw: "<% DATA.cellData.title %>",
          id: 0,
          context: {
            data: {
              cellData: {
                title: "good",
              },
            },
          },
        },
        {
          type: "re-evaluation",
          payload: {
            id: 0,
            detail: {
              raw: "<% DATA.cellData.title %>",
              result: "good",
              context: {
                DATA: {
                  cellData: {
                    title: "good",
                  },
                },
              },
            },
          },
        },
      ],
      [
        {
          raw: "<% APP.homePage %>",
          id: 3,
          context: {},
        },
        {
          type: "re-evaluation",
          payload: {
            id: 3,
            detail: {
              raw: "<% APP.homePage %>",
              result: "/easyops",
              context: {
                APP: {
                  homePage: "/easyops",
                  getMenu,
                },
              },
            },
          },
        },
      ],
      [
        {
          raw: "<% DATA.cellData.title.map(name => name) %>",
          id: 0,
          context: {
            data: {
              cellData: {
                title: "good",
              },
            },
          },
        },
        {
          type: "re-evaluation",
          payload: {
            id: 0,
            error:
              'DATA.cellData.title.map is not a function, in "<% DATA.cellData.title.map(name => name) %>"',
            detail: {
              raw: "<% DATA.cellData.title.map(name => name) %>",
              context: {
                DATA: {
                  cellData: {
                    title: "good",
                  },
                },
              },
            },
          },
        },
      ],
      [
        {
          raw: "<% EVENT.detail.name %>",
          id: 0,
          context: {
            event: {
              detail: null,
            },
          },
        },
        {
          type: "re-evaluation",
          payload: {
            id: 0,
            error:
              // "Cannot read property 'name' of null, in \"<% EVENT.detail.name %>\"",
              expect.stringContaining("Cannot read propert"),
            detail: {
              raw: "<% EVENT.detail.name %>",
              context: {
                EVENT: {
                  detail: null,
                },
              },
            },
          },
        },
      ],
    ])("evaluation params(%j) should emit %j", async (params, result) => {
      listenDevtools();

      await act(async () => {
        window.dispatchEvent(
          new MessageEvent("message", {
            data: {
              source: MESSAGE_SOURCE_PANEL,
              payload: {
                type: EVALUATION_EDIT,
                ...params,
              },
            },
          })
        );
      });

      expect(
        (window as any).__BRICK_NEXT_DEVTOOLS_HOOK__.emit
      ).toHaveBeenCalledWith(result);
    });

    it.each([
      [
        {
          transform: { value: "@{title}" },
          id: 0,
          data: {
            info: {
              title: "good",
            },
          },
          options: {
            from: "info",
          },
        },
        {
          type: "re-transformation",
          payload: {
            id: 0,
            detail: {
              transform: {
                value: "@{title}",
              },
              result: {
                value: "good",
              },
              data: {
                info: {
                  title: "good",
                },
              },
              options: {
                from: "info",
              },
            },
          },
        },
      ],
      [
        {
          transform: { value: "<% DATA.address %>" },
          id: 0,
          data: {
            address: "china",
          },
          options: {},
        },
        {
          type: "re-transformation",
          payload: {
            id: 0,
            detail: {
              transform: { value: "<% DATA.address %>" },
              result: {
                value: "china",
              },
              data: {
                address: "china",
              },
              options: {},
            },
          },
        },
      ],
      [
        {
          transform: { value: "<% DATA.address.map() %>" },
          id: 0,
          data: {
            address: "china",
          },
          options: {},
        },
        {
          type: "re-transformation",
          payload: {
            id: 0,
            error:
              'DATA.address.map is not a function, in "<% DATA.address.map() %>"',
            detail: {
              transform: { value: "<% DATA.address.map() %>" },
              data: {
                address: "china",
              },
              options: {},
            },
          },
        },
      ],
    ])(
      "transform params(%j) should return result %j",
      async (params, result) => {
        listenDevtools();

        await act(async () => {
          window.dispatchEvent(
            new MessageEvent("message", {
              data: {
                source: MESSAGE_SOURCE_PANEL,
                payload: {
                  type: TRANSFORMATION_EDIT,
                  ...params,
                },
              },
            })
          );
        });

        expect(
          (window as any).__BRICK_NEXT_DEVTOOLS_HOOK__.emit
        ).toHaveBeenCalledWith(result);
      }
    );
  });
});
