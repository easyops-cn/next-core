import { UpdatingElement } from "../UpdatingElement";
import { property } from "./property";

jest.mock("../UpdatingElement");

describe("@property", () => {
  afterEach(() => {
    (UpdatingElement.createProperty as jest.Mock).mockClear();
  });

  it("should work", () => {
    class TestElement extends UpdatingElement {
      @property({
        type: String
      })
      name: string;
    }

    expect((TestElement.createProperty as jest.Mock).mock.calls[0]).toEqual([
      "name",
      {
        type: String
      }
    ]);
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

  it("should not throw if decorate a no-attribute property with initialized value", () => {
    class TestElement extends UpdatingElement {
      @property({
        attribute: false
      })
      name = [0];
    }

    expect((TestElement.createProperty as jest.Mock).mock.calls[0]).toEqual([
      "name",
      {
        attribute: false
      }
    ]);

    const element = new TestElement();
    expect(element.name).toEqual([0]);
  });
});
