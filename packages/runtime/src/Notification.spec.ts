import { createProviderClass } from "@next-core/utils/storyboard";
import {
  Notification as _Notification,
  loadNotificationService as _loadNotificationService,
} from "./Notification.js";

jest.mock("./internal/Runtime.js", () => ({
  _internalApiLoadBricks([tagName]: [string]) {
    return tagName === "my-notification"
      ? Promise.resolve()
      : Promise.reject("oops");
  },
}));
const spyOnModalAlert = jest.spyOn(window, "alert");
const consoleError = jest.spyOn(console, "error");
const notificationService = jest.fn();
customElements.define(
  "my-notification",
  createProviderClass(notificationService)
);

describe("Notification", () => {
  let Notification: typeof _Notification;
  let loadNotificationService: typeof _loadNotificationService;

  beforeEach(() => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const n = require("./Notification.js");
      Notification = n.Notification;
      loadNotificationService = n.loadNotificationService;
    });
  });

  test("success", async () => {
    loadNotificationService("my-notification");
    await (global as any).flushPromises();
    Notification.show({
      type: "success",
      message: "Done!",
    });
    expect(notificationService).toBeCalledWith({
      type: "success",
      message: "Done!",
    });
    expect(spyOnModalAlert).not.toBeCalled();
  });

  test("error: fallback", async () => {
    consoleError.mockReturnValueOnce();
    loadNotificationService("undefined-notification");
    await (global as any).flushPromises();
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith(
      "Load notification service failed:",
      "oops"
    );

    spyOnModalAlert.mockReturnValueOnce();
    Notification.show({
      type: "error",
      message: "Ouch!",
    });
    expect(notificationService).not.toBeCalled();
    expect(spyOnModalAlert).toBeCalledTimes(1);
    expect(spyOnModalAlert).toBeCalledWith("Ouch!");
  });
});
