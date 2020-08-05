import { listenDevtools, reProcessTransform } from "./devtools";
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
            result: "good",
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
            result: "/easyops",
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
            result:
              'DATA.cellData.title.map is not a function, in "<% DATA.cellData.title.map(name => name) %>"',
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
            result: "`EVENT` is not supported debugging temporarily",
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
            title: "good",
          },
        },
        {
          type: "re-transformation",
          payload: {
            id: 0,
            result: {
              value: "good",
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
        },
        {
          type: "re-transformation",
          payload: {
            id: 0,
            result: {
              value: "china",
            },
            transform: { value: "<% DATA.address %>" },
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

  describe("reProcessTransform", () => {
    it.each([
      [
        {
          data: {
            homePage: "/easyops",
            env: {
              objectId: "host",
            },
          },
          from: "env",
          to: {
            objectId: "@{objectId}",
          },
        },
        {
          result: {
            objectId: "host",
          },
          transform: {
            objectId: "@{objectId}",
          },
        },
      ],
      [
        {
          data: {
            homePage: "/easyops",
            env: {
              objectId: "host",
              name: "主机",
            },
          },
          from: "env",
          to: [
            {
              to: {
                objectId: "@{objectId}",
              },
            },
            {
              to: {
                name: "@{name}",
              },
            },
          ],
        },
        {
          result: {
            objectId: "host",
            name: "主机",
          },
          transform: [
            {
              to: {
                objectId: "@{objectId}",
              },
            },
            {
              to: {
                name: "@{name}",
              },
            },
          ],
        },
      ],
    ])(
      "transformation params(%j) should return result(%j)",
      ({ data, to, from }, result) => {
        expect(reProcessTransform(data, to, from)).toEqual(result);
      }
    );
  });
});
