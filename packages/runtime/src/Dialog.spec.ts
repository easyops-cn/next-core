import { createProviderClass } from "@next-core/utils/storyboard";
import {
  Dialog as _Dialog,
  loadDialogService as _loadDialogService,
} from "./Dialog.js";

jest.mock("./internal/secret_internals.js", () => ({
  loadBricks([tagName]: [string]) {
    return tagName === "my-dialog" ? Promise.resolve() : Promise.reject("oops");
  },
}));
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
    loadDialogService("my-dialog");
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
    loadDialogService("undefined-dialog");
    await (global as any).flushPromises();
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith("Load dialog service failed:", "oops");

    spyOnModalConfirm.mockReturnValueOnce(true);
    const onOk = jest.fn();
    const onCancel = jest.fn();
    Dialog.show({
      type: "confirm",
      content: "Ouch!",
      onOk,
      onCancel,
    });
    expect(dialogService).not.toBeCalled();
    expect(spyOnModalConfirm).toBeCalledTimes(1);
    await new Promise((resolve) => setTimeout(resolve, 1));
    expect(onOk).toBeCalled();
    expect(onCancel).not.toBeCalled();
  });

  test("confirm: fallback and canceled", async () => {
    consoleError.mockReturnValueOnce();
    loadDialogService("undefined-dialog");
    await (global as any).flushPromises();
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith("Load dialog service failed:", "oops");

    spyOnModalConfirm.mockReturnValueOnce(false);
    const onOk = jest.fn();
    const onCancel = jest.fn();
    Dialog.show({
      type: "confirm",
      content: "Ouch!",
      onOk,
      onCancel,
    });
    expect(dialogService).not.toBeCalled();
    expect(spyOnModalConfirm).toBeCalledTimes(1);
    await new Promise((resolve) => setTimeout(resolve, 1));
    expect(onOk).not.toBeCalled();
    expect(onCancel).toBeCalled();
  });

  test("other: fallback", async () => {
    consoleError.mockReturnValueOnce();
    loadDialogService("undefined-dialog");
    await (global as any).flushPromises();
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith("Load dialog service failed:", "oops");

    spyOnModalAlert.mockReturnValueOnce();
    const onOk = jest.fn();
    Dialog.show({
      type: "success",
      content: "Ouch!",
      onOk,
    });
    expect(dialogService).not.toBeCalled();
    expect(spyOnModalAlert).toBeCalledTimes(1);
    expect(spyOnModalAlert).toBeCalledWith("Ouch!");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(onOk).toBeCalled();
  });

  test("other: fallback without onOk", async () => {
    consoleError.mockReturnValueOnce();
    loadDialogService("undefined-dialog");
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
