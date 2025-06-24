import { createProviderClass } from "@next-core/utils/general";
import {
  Notification as _Notification,
  loadNotificationService as _loadNotificationService,
} from "./Notification.js";

const loader = ([tagName]: string[]) =>
  tagName === "my-notification" ? Promise.resolve() : Promise.reject("oops");
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
    loadNotificationService("my-notification", loader);
    await (global as any).flushPromises();
    Notification.show({
      type: "success",
      message: "Done!",
    });
    expect(notificationService).toHaveBeenCalledWith({
      type: "success",
      message: "Done!",
    });
    expect(spyOnModalAlert).not.toHaveBeenCalled();
  });

  test("error: fallback", async () => {
    consoleError.mockReturnValueOnce();
    loadNotificationService("undefined-notification", loader);
    await (global as any).flushPromises();
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      "Load notification service failed:",
      "oops"
    );

    spyOnModalAlert.mockReturnValueOnce();
    Notification.show({
      type: "error",
      message: "Ouch!",
    });
    expect(notificationService).not.toHaveBeenCalled();
    expect(spyOnModalAlert).toHaveBeenCalledTimes(1);
    expect(spyOnModalAlert).toHaveBeenCalledWith("Ouch!");
  });
});
