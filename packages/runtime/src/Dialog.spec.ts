import { createProviderClass } from "@next-core/utils/general";
import {
  Dialog as _Dialog,
  loadDialogService as _loadDialogService,
} from "./Dialog.js";

const loader = ([tagName]: string[]) =>
  tagName === "my-dialog" ? Promise.resolve() : Promise.reject("oops");
const spyOnModalConfirm = jest.spyOn(window, "confirm");
const spyOnModalAlert = jest.spyOn(window, "alert");
const consoleError = jest.spyOn(console, "error");
const dialogService = jest.fn();
customElements.define("my-dialog", createProviderClass(dialogService));

describe("Dialog", () => {
  let Dialog: typeof _Dialog;
  let loadDialogService: typeof _loadDialogService;

  beforeEach(() => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const d = require("./Dialog.js");
      Dialog = d.Dialog;
      loadDialogService = d.loadDialogService;
    });
  });

  test("confirm", async () => {
    loadDialogService("my-dialog", loader);
    await (global as any).flushPromises();
    Dialog.show({
      type: "confirm",
      content: "Ouch!",
    });
    expect(dialogService).toBeCalledWith({
      type: "confirm",
      content: "Ouch!",
    });
  });

  test("confirm: fallback and confirmed", async () => {
    consoleError.mockReturnValueOnce();
    loadDialogService("undefined-dialog", loader);
    await (global as any).flushPromises();
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith("Load dialog service failed:", "oops");

    spyOnModalConfirm.mockReturnValueOnce(true);
    const promise = Dialog.show({
      type: "confirm",
      content: "Ouch!",
    });
    expect(dialogService).not.toBeCalled();
    expect(spyOnModalConfirm).toBeCalledTimes(1);
    await new Promise((resolve) => setTimeout(resolve, 1));
    await promise;
  });

  test("confirm: fallback and canceled", async () => {
    consoleError.mockReturnValueOnce();
    loadDialogService("undefined-dialog", loader);
    await (global as any).flushPromises();
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith("Load dialog service failed:", "oops");

    spyOnModalConfirm.mockReturnValueOnce(false);
    let errorCaught = false;
    Dialog.show({
      type: "confirm",
      content: "Ouch!",
    }).catch(() => {
      errorCaught = true;
    });
    expect(dialogService).not.toBeCalled();
    expect(spyOnModalConfirm).toBeCalledTimes(1);
    await new Promise((resolve) => setTimeout(resolve, 1));
    expect(errorCaught).toBe(true);
  });

  test("other: fallback", async () => {
    consoleError.mockReturnValueOnce();
    loadDialogService("undefined-dialog", loader);
    await (global as any).flushPromises();
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith("Load dialog service failed:", "oops");

    spyOnModalAlert.mockReturnValueOnce();
    Dialog.show({
      type: "success",
      content: "Ouch!",
    });
    expect(dialogService).not.toBeCalled();
    expect(spyOnModalAlert).toBeCalledTimes(1);
    expect(spyOnModalAlert).toBeCalledWith("Ouch!");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  test("other: fallback without onOk", async () => {
    consoleError.mockReturnValueOnce();
    loadDialogService("undefined-dialog", loader);
    await (global as any).flushPromises();
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith("Load dialog service failed:", "oops");

    spyOnModalAlert.mockReturnValueOnce();
    Dialog.show({
      type: "success",
      content: "Ouch!",
    });
    expect(dialogService).not.toBeCalled();
    expect(spyOnModalAlert).toBeCalledTimes(1);
    expect(spyOnModalAlert).toBeCalledWith("Ouch!");
  });
});
