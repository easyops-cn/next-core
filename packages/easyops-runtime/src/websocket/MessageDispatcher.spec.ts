import WSMock from "jest-websocket-mock";
import { MessageDispatcher } from "./MessageDispatcher.js";

const WS = WSMock as unknown as typeof WSMock.WS;
const consoleLog = jest.spyOn(console, "log").mockImplementation();
const consoleError = jest.spyOn(console, "error").mockImplementation();

describe("MessageDispatcher", () => {
  test("subscribe and unsubscribe", async () => {
    const url = "ws://localhost/api/websocket_service/v1/ws";
    const server = new WS(url);
    const client = new MessageDispatcher();

    const subPromise = client.subscribe("c1", {
      system: "s1",
      topic: "ab.cd.*",
    });
    const subPromise2 = client.subscribe("c1", {
      system: "s1",
      topic: "ab.cd.*",
    });
    const onMessage = jest.fn();
    const onMessage2 = jest.fn();
    const onClose = jest.fn();
    client.onMessage("c1", onMessage);
    client.onMessage("c2", onMessage2);
    client.onClose(onClose);
    expect(consoleError).toBeCalledWith('Message channel: "c2" not found');

    await server.connected;

    await expect(server).toReceiveMessage(
      JSON.stringify({
        event: "TOPIC.SUB",
        payload: {
          system: "s1",
          topic: "ab.cd.*",
        },
      })
    );

    const subResult = {
      event: "TOPIC.SUB_SUCCESS",
      payload: {
        source: "",
        system: "s1",
        topic: "ab.cd.*",
      },
    };
    server.send(JSON.stringify(subResult));

    const subReceived = await subPromise;
    expect(subReceived).toEqual(subResult);
    expect(await subPromise2).toEqual(subResult);

    // Push message with another topic
    server.send(
      JSON.stringify({
        event: "MESSAGE.PUSH",
        payload: {
          message: {
            oops: "yaks",
          },
          system: "s1",
          topic: "x.ab.cd.yz",
        },
      })
    );

    // Push message with the subscribed topic (wildcard)
    const message = { hello: "world" };
    server.send(
      JSON.stringify({
        event: "MESSAGE.PUSH",
        payload: {
          message,
          system: "s1",
          topic: "ab.cd.x.yz",
        },
      })
    );

    // Push message with the subscribed topic (exactly)
    const message2 = { hello: "world" };
    server.send(
      JSON.stringify({
        event: "MESSAGE.PUSH",
        payload: {
          message: message2,
          system: "s1",
          topic: "ab.cd.*",
        },
      })
    );

    expect(onMessage).toBeCalledTimes(2);
    expect(onMessage).toBeCalledWith(message);
    expect(onMessage).toBeCalledWith(message2);
    expect(onMessage2).not.toBeCalled();

    const unsubPromise = client.unsubscribe("c1");
    await expect(server).toReceiveMessage(
      JSON.stringify({
        event: "TOPIC.UNSUB",
        payload: {
          system: "s1",
          topic: "ab.cd.*",
        },
      })
    );

    const unsubResult = {
      event: "TOPIC.UNSUB_SUCCESS",
      payload: {
        source: "",
        system: "s1",
        topic: "ab.cd.*",
      },
    };
    server.send(JSON.stringify(unsubResult));

    const unsubReceived = await unsubPromise;
    expect(unsubReceived).toEqual(unsubResult);

    // Unsubscribe again
    expect(() => client.unsubscribe("c1")).rejects.toMatchInlineSnapshot(
      `[Error: The message channel to unsubscribe "c1" is not found]`
    );
    expect(consoleError).toBeCalledWith(
      'The message channel to unsubscribe "c1" is not found'
    );

    expect(onClose).not.toBeCalled();
    server.close();
    expect(onClose).toBeCalledTimes(1);

    client.reset();
  });

  test("wss and sub failed", async () => {
    const originalLocation = location;
    delete (window as any).location;
    (window as any).location = {
      protocol: "https:",
      host: "localhost",
    };
    const url = "wss://localhost/api/websocket_service/v1/ws";
    const server = new WS(url);
    const client = new MessageDispatcher();
    const subPromise = client.subscribe("c1", { system: "s1", topic: "t1" });

    await server.connected;

    await expect(server).toReceiveMessage(
      JSON.stringify({
        event: "TOPIC.SUB",
        payload: {
          system: "s1",
          topic: "t1",
        },
      })
    );

    const subResult = {
      event: "TOPIC.SUB_FAILED",
      payload: {
        source: "",
        system: "s1",
        topic: "t1",
      },
    };
    server.send(JSON.stringify(subResult));

    expect(subPromise).rejects.toEqual(subResult);

    window.location = originalLocation;
  });
});
