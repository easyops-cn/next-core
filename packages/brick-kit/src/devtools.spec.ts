import { listenDevtools } from "./devtools";
import {
  TRANSFORMATION_EDIT,
  EVALUATION_EDIT,
  MESSAGE_SOURCE_PANEL,
} from "./devtools";
import { act } from "react-dom/test-utils";

jest.mock("./core/Runtime", () => ({
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
            raw: "<% DATA.cellData.title %>",
            id: 0,
            result: {
              data: "good",
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
            raw: "<% APP.homePage %>",
            id: 3,
            result: {
              data: "/easyops",
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
            raw: "<% DATA.cellData.title.map(name => name) %>",
            id: 0,
            result: {
              error:
                'DATA.cellData.title.map is not a function, in "<% DATA.cellData.title.map(name => name) %>"',
            },
          },
        },
      ],
      [
        {
          raw: "<% EVENT.detail.name %>",
          id: 0,
          context: {
            data: {
              cellData: {
                title: "good",
              },
            },
            event: {
              detail: {
                name: "easyops",
              },
            },
          },
        },
        {
          type: "re-evaluation",
          payload: {
            raw: "<% EVENT.detail.name %>",
            id: 0,
            result: {
              error: "`EVENT` is not supported debug temporarily",
            },
          },
        },
      ],
    ])(
      "evaluation params(%j) should return result %j",
      async (params, result) => {
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
      }
    );

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
            result: {
              data: {
                value: "good",
              },
            },
            transform: {
              value: "@{title}",
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
            result: {
              data: {
                value: "china",
              },
            },
            transform: { value: "<% DATA.address %>" },
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
            result: {
              error:
                'DATA.address.map is not a function, in "<% DATA.address.map() %>"',
            },
            transform: { value: "<% DATA.address.map() %>" },
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
