import { UpdatingElement } from "../UpdatingElement";
import { method } from "./method";
jest.mock("../UpdatingElement");
describe("@method", () => {
  it("should work", async () => {
    class TestElement extends UpdatingElement {
      @method()
      handleHappy(): boolean {
        return true;
      }
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      protected _render(): void {}
    }

    const instance = new TestElement();

    expect(instance.handleHappy()).toBe(true);
  });

  it("should throw if decorate a property", () => {
    expect.assertions(1);
    try {
      class TestElement extends UpdatingElement {
        @method()
        value: boolean;

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        protected _render(): void {}
      }
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

  it("should throw if decorate a function property", () => {
    expect.assertions(1);
    try {
      class TestElement extends UpdatingElement {
        @method()
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        submit = (): void => {};

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        protected _render(): void {}
      }
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });
});
