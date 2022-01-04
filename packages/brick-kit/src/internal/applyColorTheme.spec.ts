import { applyColorTheme } from "./applyColorTheme";

describe("applyColorTheme", () => {
  const getStyles = () => document.head.querySelectorAll("style");

  it("should set brand color", () => {
    const undo = applyColorTheme({
      type: "brandColor",
      light: "red",
      dark: "darkred",
    });

    expect(getStyles().length).toBe(1);
    expect(getStyles()[0].textContent).toMatchInlineSnapshot(`
      ":root,
      [data-override-theme=\\"light\\"] {
        --color-brand: red;
      }

      html[data-theme=\\"dark-v2\\"],
      [data-override-theme=\\"dark-v2\\"] {
        --color-brand: darkred;
      }"
    `);

    undo();
    expect(getStyles().length).toBe(0);
  });

  it("should set base colors", () => {
    const undo = applyColorTheme({
      type: "baseColors",
      light: {
        red: "#f5222d",
        green: "#52c41a",
      },
      dark: {
        red: "#f5222d",
        green: "#52c41a",
      },
      backgroundColor: "#141414",
    });

    expect(getStyles().length).toBe(1);
    expect(getStyles()[0].textContent).toMatchInlineSnapshot(`
      ":root,
      [data-override-theme=\\"light\\"] {
        --palette-red-1: #fff1f0;
        --palette-red-2: #ffccc7;
        --palette-red-3: #ffa39e;
        --palette-red-4: #ff7875;
        --palette-red-5: #ff4d4f;
        --palette-red-6: #f5222d;
        --palette-red-7: #cf1322;
        --palette-red-8: #a8071a;
        --palette-red-9: #820014;
        --palette-red-10: #5c0011;

        --palette-green-1: #f6ffed;
        --palette-green-2: #d9f7be;
        --palette-green-3: #b7eb8f;
        --palette-green-4: #95de64;
        --palette-green-5: #73d13d;
        --palette-green-6: #52c41a;
        --palette-green-7: #389e0d;
        --palette-green-8: #237804;
        --palette-green-9: #135200;
        --palette-green-10: #092b00;
      }

      html[data-theme=\\"dark-v2\\"],
      [data-override-theme=\\"dark-v2\\"] {
        --palette-red-1: #2a1215;
        --palette-red-2: #431418;
        --palette-red-3: #58181c;
        --palette-red-4: #791a1f;
        --palette-red-5: #a61d24;
        --palette-red-6: #d32029;
        --palette-red-7: #e84749;
        --palette-red-8: #f37370;
        --palette-red-9: #f89f9a;
        --palette-red-10: #fac8c3;

        --palette-green-1: #162312;
        --palette-green-2: #1d3712;
        --palette-green-3: #274916;
        --palette-green-4: #306317;
        --palette-green-5: #3c8618;
        --palette-green-6: #49aa19;
        --palette-green-7: #6abe39;
        --palette-green-8: #8fd460;
        --palette-green-9: #b2e58b;
        --palette-green-10: #d5f2bb;
      }"
    `);

    undo();
    expect(getStyles().length).toBe(0);
  });

  it("should set variables", () => {
    const undo = applyColorTheme({
      type: "variables",
      light: {
        "--color-brand": "red",
        "--palette-blue-6": "blue",
      },
      dark: {
        "--color-brand": "darkred",
        "--palette-blue-6": "darkblue",
      },
    });

    expect(getStyles().length).toBe(1);
    expect(getStyles()[0].textContent).toMatchInlineSnapshot(`
      ":root,
      [data-override-theme=\\"light\\"] {
        --color-brand: red;
        --palette-blue-6: blue;
      }

      html[data-theme=\\"dark-v2\\"],
      [data-override-theme=\\"dark-v2\\"] {
        --color-brand: darkred;
        --palette-blue-6: darkblue;
      }"
    `);

    undo();
    expect(getStyles().length).toBe(0);
  });

  it("should set light only brand color", () => {
    const undo = applyColorTheme({
      type: "brandColor",
      light: "red",
    });

    expect(getStyles().length).toBe(1);
    expect(getStyles()[0].textContent).toMatchInlineSnapshot(`
      ":root,
      [data-override-theme=\\"light\\"] {
        --color-brand: red;
      }"
    `);

    undo();
    expect(getStyles().length).toBe(0);
  });

  it("should set dark only brand color", () => {
    const undo = applyColorTheme({
      type: "brandColor",
      dark: "darkred",
    });

    expect(getStyles().length).toBe(1);
    expect(getStyles()[0].textContent).toMatchInlineSnapshot(`
      "html[data-theme=\\"dark-v2\\"],
      [data-override-theme=\\"dark-v2\\"] {
        --color-brand: darkred;
      }"
    `);

    undo();
    expect(getStyles().length).toBe(0);
  });

  it("should does nothing for unknown type", () => {
    const undo = applyColorTheme({
      type: "unknown" as any,
      light: "red",
    });
    expect(getStyles.length).toBe(0);
    expect(undo).toBe(undefined);
  });
});
