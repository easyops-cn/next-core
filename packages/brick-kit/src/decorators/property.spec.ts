import { UpdatingElement } from "../UpdatingElement";
import { property } from "./property";

jest.mock("../UpdatingElement");

describe("@property", () => {
  it("should work", () => {
    class TestElement extends UpdatingElement {
      @property({
        type: String
      })
      name: string;
    }

    expect((TestElement.createProperty as jest.Mock).mock.calls[0][0]).toBe(
      "name"
    );
    expect((TestElement.createProperty as jest.Mock).mock.calls[0][1]).toEqual({
      type: String
    });
  });

  it("should throw if decorate a method", () => {
    expect.assertions(1);
    try {
      class TestElement extends UpdatingElement {
        @property()
        someMethod(): void {
          // empty
        }
      }
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

  it("should throw if decorate a property with initialized value", () => {
    expect.assertions(1);
    try {
      class TestElement extends UpdatingElement {
        @property()
        name = "hello";
      }
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });
});
