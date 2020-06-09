import { UpdatingElement } from "../UpdatingElement";
import { method } from "./method";
jest.mock("../UpdatingElement");
describe("@method", () => {
  it("should work", async () => {
    class TestElement extends UpdatingElement {
      @method()
      handleHappy = () => {
        return true;
      };
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      protected _render(): void {}
    }

    const instance = new TestElement();

    expect(instance.handleHappy()).toBe(true);
  });
});
