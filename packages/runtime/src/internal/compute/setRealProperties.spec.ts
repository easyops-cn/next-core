import { setRealProperties, setValueForStyle } from "./setRealProperties.js";

describe("setValueForStyle", () => {
  let mockStyle: CSSStyleDeclaration;

  beforeEach(() => {
    mockStyle = {
      setProperty: jest.fn(),
      cssFloat: "",
    } as unknown as CSSStyleDeclaration;
  });

  it("should set custom CSS property using setProperty when key starts with --", () => {
    setValueForStyle(mockStyle, "--custom-color", "red");

    expect(mockStyle.setProperty).toHaveBeenCalledWith("--custom-color", "red");
  });

  it('should set cssFloat property when key is "float"', () => {
    setValueForStyle(mockStyle, "float", "left");

    expect(mockStyle.cssFloat).toBe("left");
  });

  it("should set regular style property directly", () => {
    setValueForStyle(mockStyle, "color", "blue");

    expect((mockStyle as any).color).toBe("blue");
  });

  it("should set multiple regular properties", () => {
    setValueForStyle(mockStyle, "fontSize", "16px");
    setValueForStyle(mockStyle, "margin", "10px");

    expect((mockStyle as any).fontSize).toBe("16px");
    expect((mockStyle as any).margin).toBe("10px");
  });
});

describe("setRealProperties", () => {
  test("should set plain data attributes on the element", () => {
    const brick = document.createElement("div");
    const realProps = {
      "data-test": "value1",
      "data-info": "value2",
    };

    setRealProperties(brick, realProps);

    expect(brick.getAttribute("data-test")).toBe("value1");
    expect(brick.getAttribute("data-info")).toBe("value2");
  });
});
