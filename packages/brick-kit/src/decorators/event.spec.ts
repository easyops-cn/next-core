import { UpdatingElement } from "../UpdatingElement";
import { event, EventEmitter } from "./event";

describe("@event", () => {
  it("should work", async () => {
    class TestElement extends UpdatingElement {
      @event({
        type: "customEvent.beHappy",
      })
      beHappy: EventEmitter<boolean>;

      handleHappy = () => {
        this.beHappy.emit(true);
      };
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      protected _render(): void {}
    }

    customElements.define("test-bricks.test-event", TestElement);

    const mockEventListenerFn = jest.fn();

    const element = document.createElement("test-bricks.test-event");
    element.addEventListener("customEvent.beHappy", mockEventListenerFn);

    document.body.appendChild(element);

    await jest.runAllTimers();

    (element as any).handleHappy();

    expect(mockEventListenerFn).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: true })
    );
  });

  it("should throw if decorate not a class string property", () => {
    expect.assertions(2);
    try {
      class TestElement extends UpdatingElement {
        @event({
          type: "customEvent.beHappy",
        })
        testMethod(): void {
          // Noting todo.
        }
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        protected _render(): void {}
      }
    } catch (error) {
      expect(error).toBeTruthy();
    }

    try {
      @event({
        type: "customEvent.beHappy",
      })
      class TestElement extends UpdatingElement {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        protected _render(): void {}
      }
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

  it("should throw error when decorate has initializer", async () => {
    const date = new Date();
    expect.assertions(1);

    try {
      class TestElement extends UpdatingElement {
        @event({
          type: "customEvent.beHappy",
        })
        beHappy = 1;

        handleHappy = () => {
          (this.beHappy as any).emit(1);
        };
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        protected _render(): void {}
      }
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });
});
