import { BroadcastChannel as PolyfillChannel } from "broadcast-channel";
import { refreshPageIfAuthenticationChanged as _refreshPageIfAuthenticationChanged } from "./AuthenticationChange";
import { Dialog } from "@next-core/runtime";

jest.mock("@next-core/runtime", () => ({
  Dialog: {
    show: jest.fn(() => Promise.resolve()),
  },
  getRuntime() {
    return {
      getFeatureFlags() {
        return {
          "refresh-page-if-authentication-changed": true,
        };
      },
    };
  },
}));

jest.mock("broadcast-channel", () => ({
  BroadcastChannel: mockBroadcastChannel(true),
}));

const FakeBroadcastChannel = mockBroadcastChannel(false);

delete (window as any).location;
(window as any).location = {
  reload: jest.fn(),
};

describe("AuthenticationChange", () => {
  let refreshPageIfAuthenticationChanged: typeof _refreshPageIfAuthenticationChanged;

  beforeEach(() => {
    (window as any).BroadcastChannel = undefined;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const m = require("./AuthenticationChange");
      refreshPageIfAuthenticationChanged = m.refreshPageIfAuthenticationChanged;
    });
  });

  test("logout", async () => {
    (window as any).BroadcastChannel = FakeBroadcastChannel;
    await refreshPageIfAuthenticationChanged({ org: 1, username: "test" });

    const peer = new FakeBroadcastChannel("brick-next:authentication-change");
    peer.postMessage({ type: "check-login", username: "test", org: 1 });
    expect(Dialog.show).not.toHaveBeenCalled();

    peer.postMessage({ type: "unknown" });
    expect(Dialog.show).not.toHaveBeenCalled();

    peer.postMessage({ type: "logout" });
    expect(Dialog.show).toHaveBeenCalledWith({
      type: "warn",
    });
    expect(window.location.reload).not.toHaveBeenCalled();

    await (global as any).flushPromises();
    expect(window.location.reload).toHaveBeenCalled();

    // Only warn the user once.
    peer.postMessage({ type: "logout" });
    expect(Dialog.show).toHaveBeenCalledTimes(1);
  });

  test("polyfill and check-login", async () => {
    await refreshPageIfAuthenticationChanged({ org: 1, username: "test" });

    const peer = new PolyfillChannel("brick-next:authentication-change");

    peer.postMessage({ type: "check-login", org: 1, username: "another" });
    expect(Dialog.show).toHaveBeenCalledWith({
      type: "warn",
    });
    expect(window.location.reload).not.toHaveBeenCalled();

    await (global as any).flushPromises();
    expect(window.location.reload).toHaveBeenCalled();

    // Only warn the user once.
    peer.postMessage({ type: "check-login", org: 1, username: "whoever" });
    expect(Dialog.show).toHaveBeenCalledTimes(1);
  });
});

function mockBroadcastChannel(polyfill: boolean) {
  const channels = new Map<string, Set<FakeBroadcastChannel>>();

  class FakeBroadcastChannel {
    messageListeners = new Set<Function>();
    private channelName: string;
    constructor(channelName: string) {
      this.channelName = channelName;
      let list = channels.get(channelName);
      if (!list) {
        channels.set(channelName, (list = new Set()));
      }
      list.add(this);
    }
    addEventListener(eventType: string, fn: Function): void {
      if (eventType === "message") {
        this.messageListeners.add(fn);
      }
    }
    postMessage(data: unknown): void {
      for (const channel of channels.get(this.channelName) ?? []) {
        if (channel !== this) {
          for (const fn of channel.messageListeners) {
            fn(polyfill ? data : { data });
          }
        }
      }
    }
  }

  return FakeBroadcastChannel;
}
