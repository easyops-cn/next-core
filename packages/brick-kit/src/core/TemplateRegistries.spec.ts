import {
  registerBrickTemplate,
  brickTemplateRegistry,
} from "./TemplateRegistries";

const consoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => void 0);

describe("registerBrickTemplate", () => {
  it("should ignore duplicated templates", () => {
    registerBrickTemplate("a", jest.fn());
    expect(brickTemplateRegistry.size).toBe(1);
    registerBrickTemplate("a", jest.fn());
    expect(brickTemplateRegistry.size).toBe(1);
    expect(consoleError).toBeCalledTimes(1);
  });
});
