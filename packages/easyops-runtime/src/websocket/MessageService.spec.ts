import WSMock from "jest-websocket-mock";
import { MessageService } from "./MessageService.js";

const WS = WSMock as unknown as typeof WSMock.WS;
const consoleLog = jest.spyOn(console, "log").mockImplementation();
const consoleError = jest.spyOn(console, "error").mockImplementation();

describe("MessageService", () => {
  const url = "ws://localhost:8080";
  let server: WSMock.WS;
  let client: MessageService;

  beforeEach(() => {
    server = new WS(url);
    client = new MessageService(url);
  });

  test("connect to WebSocket server", async () => {
    const onMessage = jest.fn();
    const onClose = jest.fn();
    client.onMessage(onMessage);
    client.onClose(onClose);

    client.send("before");
    await server.connected;
    client.send("after");
    await expect(server).toReceiveMessage('"before"');
    await expect(server).toReceiveMessage('"after"');

    server.send('"ok"');
    expect(onMessage).toBeCalledWith("ok");

    client.reset();
    server.send('"again"');
    expect(onMessage).toBeCalledTimes(1);

    client.close();
    server.close();

    // `onClose` is not called because of reset
    expect(onClose).not.toBeCalled();
  });

  test("handle error and reconnect", async () => {
    const onClose = jest.fn();
    client.onClose(onClose);

    client.send("ping");
    await server.connected;
    server.error({
      code: 1001,
      reason: "test",
      wasClean: false,
    });
    expect(consoleError).toBeCalledWith("WebSocket error:", expect.anything());
    expect(onClose).toBeCalledTimes(1);

    expect(consoleLog).toBeCalledWith(
      "WebSocket will reconnect after %d seconds",
      1
    );

    await new Promise((resolve) => setTimeout(resolve, 1500));

    client.close();
  });
});
