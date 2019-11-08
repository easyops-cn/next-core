import { ModalElement } from "./ModalElement";

jest.mock("../UpdatingElement");

describe("ModalElement", () => {
  it("should work", () => {
    class TestModalElement extends ModalElement {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      protected _render(): void {}
    }

    const element = new TestModalElement();
    expect(element.isVisible).toBeFalsy();

    element.openModal();
    expect(element.isVisible).toBeTruthy();

    element.closeModal();
    expect(element.isVisible).toBeFalsy();

    element.openModal({ detail: { mask: "mask" } } as CustomEvent);
    expect(element.isVisible).toBeTruthy();
    expect((element as any).mask).toBe("mask");

    element.openModal({ detail: "mask" } as CustomEvent);
    expect(element.isVisible).toBe(true);
    expect((element as any).detail).toBe("mask");

    element.openModal({ detail: false } as CustomEvent);
    expect(element.isVisible).toBeTruthy();
    expect((element as any).detail).toBe(false);

    element.openModal({ detail: 2 } as CustomEvent);
    expect(element.isVisible).toBeTruthy();
    expect((element as any).detail).toBe(2);

    element.openModal({ detail: ["a", "b"] } as CustomEvent);
    expect(element.isVisible).toBeTruthy();
    expect((element as any).detail).toEqual(["a", "b"]);
  });
});
