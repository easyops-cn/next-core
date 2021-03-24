import { UpdatingElement } from "../UpdatingElement";
import { property } from "./property";

jest.mock("../UpdatingElement");

describe("@property", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should work", () => {
    class TestElement extends UpdatingElement {
      @property({
        type: String,
      })
      name: string;
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      protected _render(): void {}
    }
    expect(TestElement.createProperty).toBeCalledWith("name", {
      type: String,
    });
  });

  it("should throw if decorate a getter", () => {
    expect.assertions(1);
    try {
      class TestElement extends UpdatingElement {
        @property()
        get name(): string {
          return "fake-name";
        }
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        protected _render(): void {}
      }
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

  it("should throw if decorate a method", () => {
    expect.assertions(1);
    try {
      class TestElement extends UpdatingElement {
        @property()
        someMethod(): void {
          // empty
        }
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        protected _render(): void {}
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
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        protected _render(): void {}
      }
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

  it("should not throw if decorate a no-attribute property with initialized value", () => {
    class TestElement extends UpdatingElement {
      @property({
        attribute: false,
      })
      name = [0];
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      protected _render(): void {}
    }

    expect(TestElement.createProperty).toBeCalledWith("name", {
      attribute: false,
    });

    const element = new TestElement();
    expect(element.name).toEqual([0]);
  });

  it("should ignore decorating a normal property if specified", () => {
    class TestElement extends UpdatingElement {
      @property({
        type: String,
        __unstable_doNotDecorate: true,
      })
      name: string;
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      protected _render(): void {}
    }

    expect(TestElement.createProperty).not.toBeCalled();

    const instance = new TestElement();
    expect(instance.name).toBe(undefined);
  });

  it("should ignore decorating a getter if specified", () => {
    class TestElement extends UpdatingElement {
      @property({
        type: String,
        __unstable_doNotDecorate: true,
      })
      get name(): string {
        return "fake-name";
      }
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      protected _render(): void {}
    }

    expect(TestElement.createProperty).not.toBeCalled();

    const instance = new TestElement();
    expect(instance.name).toBe("fake-name");
  });
});
