import {
  registerBrickTemplate,
  brickTemplateRegistry
} from "./TemplateRegistries";

describe("registerBrickTemplate", () => {
  it("should ignore duplicated templates", () => {
    registerBrickTemplate("a", jest.fn());
    expect(brickTemplateRegistry.size).toBe(1);
    registerBrickTemplate("a", jest.fn());
    expect(brickTemplateRegistry.size).toBe(1);
  });
});
