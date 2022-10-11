import { abortController } from "./abortController";

const mockAbortFn = jest.fn();

jest
  .spyOn(AbortController.prototype, "abort")
  .mockImplementation(() => mockAbortFn());
describe("Abort Controller", () => {
  it("should work", () => {
    expect(typeof abortController.getSignalToken()).toBe("object");
    abortController.abortPendingRequest();
    expect(mockAbortFn).toHaveBeenCalled();
  });
});
