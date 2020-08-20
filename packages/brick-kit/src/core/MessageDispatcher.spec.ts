import {
  createMessageDispatcher,
  getMessageDispatcher,
  MessageDispatcher,
} from "./MessageDispatcher";
import { MessageConf, PluginRuntimeContext } from "@easyops/brick-types";
import * as WS from "../websocket/WebSocket";
import * as BL from "../bindListeners";
import {
  MessageBrickEventHandlerCallback,
  PluginWebSocketMessageEvent,
} from "../websocket/interfaces";
import { WebsocketMessageResponse } from "../websocket";

const spyOnListenerFactory = jest
  .spyOn(BL, "listenerFactory")
  .mockImplementation(() => () => jest.fn());

const mockSend = jest.fn();
const context: PluginRuntimeContext = {
  query: new URLSearchParams("a=x&b=2&b=1"),
  match: {
    params: {
      objectId: "HOST",
    },
    path: "",
    url: "",
    isExact: false,
  },
  event: new CustomEvent("hello", {
    detail: "world",
  }),
  app: {
    homepage: "/cmdb",
    name: "cmdb",
    id: "cmdb",
  },
  sys: {
    org: 8888,
    username: "easyops",
    userInstanceId: "acbd46b",
  },
  flags: {
    "better-world": true,
  },
};
const mockElement = document.createElement("div");
const mockBrickAndMessages = [
  {
    brick: {
      type: "div",
      context: context,
      element: mockElement,
    },
    match: {
      path: "/developers/brick-book",
      url: "/developers/brick-book",
      isExact: true,
      params: {},
    },
    message: [
      {
        channel: {
          system: "pipeline",
          topic: "pipeline.task.running.001",
        },
        handlers: [
          {
            action: "console.warn",
          },
        ],
      } as MessageConf,
    ],
  },
  {
    brick: {
      type: "div",
      context: context,
      element: document.createElement("span"),
    },
    match: {
      path: "/developers/brick-book",
      url: "/developers/brick-book",
      isExact: true,
      params: {},
    },
    message: [
      {
        channel: {
          system: "pipeline",
          topic: "pipeline.task.running.001",
        },
        handlers: [
          {
            action: "console.log",
          },
        ],
      } as MessageConf,
    ],
  },
];

const spyOnGetWebSocket = jest.spyOn(WS, "getWebSocket").mockImplementation(
  () =>
    ({
      send: mockSend,
    } as any)
);

jest.spyOn(console, "error");
describe("MessageDispatcher", () => {
  let md: MessageDispatcher;
  beforeAll(() => {
    md = createMessageDispatcher();
    md.create(mockBrickAndMessages, context);
  });

  afterAll(() => {
    md.reset();
    spyOnListenerFactory.mockClear();
  });

  describe("test subscribe message ", () => {
    it("should call subscribe message callback handler", async () => {
      const topic = {
        system: "pipeline",
        topic: "pipeline.task.running.001",
      };
      const callback = {
        brick: mockElement,
        context,
        success: { action: "console.log" },
        error: { action: "console.error" },
      };

      // subscribe message success
      md.subscribe(topic, callback as MessageBrickEventHandlerCallback);
      md.subscribe(topic, callback as MessageBrickEventHandlerCallback);

      spyOnGetWebSocket.mock.results[0].value.onMessage(
        new WebsocketMessageResponse(
          `{"event":"TOPIC.SUB_SUCCESS","sessionID":"9336039e-2ae7-4caa-93ea-f1fae213ee3f","payload":{"source":"","system":"pipeline","topic":"pipeline.task.running.001"}}`
        )
      );
      expect(spyOnListenerFactory).toHaveBeenCalledWith(
        { action: "console.log" },
        context,
        mockElement
      );
      spyOnListenerFactory.mockClear();
      // subscribe message failed
      spyOnGetWebSocket.mock.results[0].value.onMessage(
        new WebsocketMessageResponse(
          `{"event":"TOPIC.SUB_FAILED","sessionID":"9336039e-2ae7-4caa-93ea-f1fae213ee3f","payload":{"source":"","system":"pipeline","topic":"pipeline.task.running.001"}}`
        )
      );
      expect(spyOnListenerFactory).toHaveBeenCalledWith(
        { action: "console.error" },
        context,
        mockElement
      );
    });

    it(`should dispatch ${PluginWebSocketMessageEvent.MESSAGE_PUSH} message`, () => {
      spyOnGetWebSocket.mock.results[0].value.onMessage(
        new WebsocketMessageResponse(
          `{"event":"MESSAGE.PUSH","sessionID":"","payload":{"system":"pipeline","topic":"pipeline.task.running.001","expire":600,"message":{"code":200,"codeExplain":"","error":"","data":{"id":"100","status":{"started":"1592475479","state":"running","updated":"1592475470"}}}}}`
        )
      );

      expect(spyOnListenerFactory).toHaveBeenCalledWith(
        { action: "console.warn" },
        context,
        mockElement
      );

      spyOnListenerFactory.mockClear();

      spyOnGetWebSocket.mock.results[0].value.onMessage(
        new WebsocketMessageResponse(
          `{"event":"MESSAGE.PUSH","sessionID":"","payload":{"system":"pipeline","topic":"pipeline.task.running.unknown","expire":600,"message":{"code":200,"codeExplain":"","error":"","data":{"id":"100","status":{"started":"1592475479","state":"running","updated":"1592475470"}}}}}`
        )
      );

      expect(spyOnListenerFactory).not.toHaveBeenCalled();
    });
  });

  describe("test unsubscribe message", () => {
    it("should call subscribe message callback handler", async () => {
      const topic = {
        system: "pipeline",
        topic: "pipeline.task.running.001",
      };
      const callback = {
        brick: mockElement,
        context,
        success: { action: "console.log" },
        error: { action: "console.error" },
      };

      // subscribe message success
      md.unsubscribe(topic, callback as MessageBrickEventHandlerCallback);

      spyOnGetWebSocket.mock.results[0].value.onMessage(
        new WebsocketMessageResponse(
          `{"event":"TOPIC.UNSUB_SUCCESS","sessionID":"9336039e-2ae7-4caa-93ea-f1fae213ee3f","payload":{"source":"","system":"pipeline","topic":"pipeline.task.running.001"}}`
        )
      );
      expect(spyOnListenerFactory).toHaveBeenCalledWith(
        { action: "console.log" },
        context,
        mockElement
      );
      spyOnListenerFactory.mockClear();
      // subscribe message failed
      spyOnGetWebSocket.mock.results[0].value.onMessage(
        new WebsocketMessageResponse(
          `{"event":"TOPIC.UNSUB_FAILED","sessionID":"9336039e-2ae7-4caa-93ea-f1fae213ee3f","payload":{"source":"","system":"pipeline","topic":"pipeline.task.running.001"}}`
        )
      );
      expect(spyOnListenerFactory).toHaveBeenCalledWith(
        { action: "console.error" },
        context,
        mockElement
      );
    });
  });

  it("print Unknown message event", () => {
    spyOnGetWebSocket.mock.results[0].value.onMessage(
      new WebsocketMessageResponse(
        `{"event":"CUSTOM.PUSH_EVENT","sessionID":"9336039e-2ae7-4caa-93ea-f1fae213ee3f","payload":{"source":"","system":"pipeline","topic":"pipeline.task.running.001"}}`
      )
    );

    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalledWith(
      "Unknown message event:",
      "CUSTOM.PUSH_EVENT"
    );
  });

  it("test getMessageDispatcher", () => {
    const instance = getMessageDispatcher();
    expect(instance instanceof MessageDispatcher).toBe(true);
  });
});
