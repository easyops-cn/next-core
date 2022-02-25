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
        red: "#f24c25",
        green: "#52c41a",
        blue: "#1a7aff",
        cyan: "#21d4f3",
        orange: "#e38306",
        purple: "#893ad8",
        indigo: "#3844e8",
      },
      dark: {
        red: "#f34d27",
        green: "#7bff21",
        blue: "#1a7aff",
        cyan: "#21d5f5",
        orange: "#e48408",
        purple: "#8a3bda",
        indigo: "#3946ea",
      },
      backgroundColor: "#17171a",
    });

    expect(getStyles().length).toBe(1);
    expect(getStyles()[0].textContent).toMatchInlineSnapshot(`
      ":root,
      [data-override-theme=\\"light\\"] {
        --palette-red-1: #fff5f0;
        --palette-red-2: #ffdac9;
        --palette-red-3: #ffbba1;
        --palette-red-4: #ff9a78;
        --palette-red-5: #ff754f;
        --palette-red-6: #f24c25;
        --palette-red-7: #cc3014;
        --palette-red-8: #a61b08;
        --palette-red-9: #800b00;
        --palette-red-10: #590400;

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

        --palette-blue-1: #e6f4ff;
        --palette-blue-2: #bde1ff;
        --palette-blue-3: #94cbff;
        --palette-blue-4: #6bb3ff;
        --palette-blue-5: #4297ff;
        --palette-blue-6: #1a7aff;
        --palette-blue-7: #0b5ad9;
        --palette-blue-8: #003eb3;
        --palette-blue-9: #002c8c;
        --palette-blue-10: #001d66;

        --palette-cyan-1: #f0ffff;
        --palette-cyan-2: #c7feff;
        --palette-cyan-3: #9efaff;
        --palette-cyan-4: #75f4ff;
        --palette-cyan-5: #4deaff;
        --palette-cyan-6: #21d4f3;
        --palette-cyan-7: #12aacc;
        --palette-cyan-8: #0783a6;
        --palette-cyan-9: #006080;
        --palette-cyan-10: #004059;

        --palette-orange-1: #fff8e6;
        --palette-orange-2: #ffe6ab;
        --palette-orange-3: #ffd582;
        --palette-orange-4: #fcc058;
        --palette-orange-5: #f0a22e;
        --palette-orange-6: #e38306;
        --palette-orange-7: #bd6500;
        --palette-orange-8: #964b00;
        --palette-orange-9: #703400;
        --palette-orange-10: #4a2000;

        --palette-purple-1: #faf0ff;
        --palette-purple-2: #f7e8ff;
        --palette-purple-3: #e6bfff;
        --palette-purple-4: #c78ff2;
        --palette-purple-5: #a863e6;
        --palette-purple-6: #893ad8;
        --palette-purple-7: #6827b3;
        --palette-purple-8: #4a188c;
        --palette-purple-9: #300c66;
        --palette-purple-10: #1c0740;

        --palette-indigo-1: #f0f3ff;
        --palette-indigo-2: #e0e7ff;
        --palette-indigo-3: #b8c4ff;
        --palette-indigo-4: #8f9eff;
        --palette-indigo-5: #6271f5;
        --palette-indigo-6: #3844e8;
        --palette-indigo-7: #252ac2;
        --palette-indigo-8: #16169c;
        --palette-indigo-9: #0e0b75;
        --palette-indigo-10: #0b064f;

        --theme-green-color-rgb-channel: 82, 196, 26;
        --theme-green-color: var(--palette-green-6);
        --theme-green-border-color: var(--palette-green-3);
        --theme-green-background: var(--palette-green-1);

        --theme-red-color-rgb-channel: 242, 76, 37;
        --theme-red-color: var(--palette-red-6);
        --theme-red-border-color: var(--palette-red-3);
        --theme-red-background: var(--palette-red-1);

        --theme-blue-color-rgb-channel: 26, 122, 255;
        --theme-blue-color: var(--palette-blue-6);
        --theme-blue-border-color: var(--palette-blue-3);
        --theme-blue-background: var(--palette-blue-1);

        --theme-orange-color-rgb-channel: 227, 131, 6;
        --theme-orange-color: var(--palette-orange-6);
        --theme-orange-border-color: var(--palette-orange-3);
        --theme-orange-background: var(--palette-orange-1);

        --theme-cyan-color-rgb-channel: 33, 212, 243;
        --theme-cyan-color: var(--palette-cyan-6);
        --theme-cyan-border-color: var(--palette-cyan-3);
        --theme-cyan-background: var(--palette-cyan-1);

        --theme-purple-color-rgb-channel: 137, 58, 216;
        --theme-purple-color: var(--palette-purple-6);
        --theme-purple-border-color: var(--palette-purple-3);
        --theme-purple-background: var(--palette-purple-1);

        --theme-geekblue-color-rgb-channel: 56, 68, 232;
        --theme-geekblue-color: var(--palette-indigo-6);
        --theme-geekblue-border-color: var(--palette-indigo-3);
        --theme-geekblue-background: var(--palette-indigo-1);
      }

      html[data-theme=\\"dark-v2\\"],
      [data-override-theme=\\"dark-v2\\"] {
        --palette-red-1: #2c1818;
        --palette-red-2: #441e19;
        --palette-red-3: #59271e;
        --palette-red-4: #7a2f20;
        --palette-red-5: #a63a22;
        --palette-red-6: #d24525;
        --palette-red-7: #e86d4c;
        --palette-red-8: #f39575;
        --palette-red-9: #f8b89f;
        --palette-red-10: #fad8c8;

        --palette-green-1: #1d2e17;
        --palette-green-2: #284818;
        --palette-green-3: #355d1c;
        --palette-green-4: #447f1d;
        --palette-green-5: #58ae1f;
        --palette-green-6: #6cdc20;
        --palette-green-7: #8be845;
        --palette-green-8: #acf36f;
        --palette-green-9: #c8f898;
        --palette-green-10: #e0fac1;

        --palette-blue-1: #141d31;
        --palette-blue-2: #14284a;
        --palette-blue-3: #18355f;
        --palette-blue-4: #184481;
        --palette-blue-5: #1957af;
        --palette-blue-6: #1a6bdd;
        --palette-blue-7: #3e8ae8;
        --palette-blue-8: #67abf4;
        --palette-blue-9: #90c6f8;
        --palette-blue-10: #baddfa;

        --palette-cyan-1: #14282f;
        --palette-cyan-2: #163c47;
        --palette-cyan-3: #1a505c;
        --palette-cyan-4: #1c6d7d;
        --palette-cyan-5: #1e93a8;
        --palette-cyan-6: #20b9d4;
        --palette-cyan-7: #45d5e8;
        --palette-cyan-8: #6ee8f4;
        --palette-cyan-9: #98f3f8;
        --palette-cyan-10: #c1f9fa;

        --palette-orange-1: #2a1f16;
        --palette-orange-2: #412b14;
        --palette-orange-3: #553815;
        --palette-orange-4: #734812;
        --palette-orange-5: #9c5e0e;
        --palette-orange-6: #c5740b;
        --palette-orange-7: #da952e;
        --palette-orange-8: #f1b958;
        --palette-orange-9: #f8d082;
        --palette-orange-10: #fae3aa;

        --palette-purple-1: #1f172b;
        --palette-purple-2: #2b1b40;
        --palette-purple-3: #3a2254;
        --palette-purple-4: #4b2770;
        --palette-purple-5: #622e97;
        --palette-purple-6: #7936bd;
        --palette-purple-7: #9a5bd2;
        --palette-purple-8: #be89e7;
        --palette-purple-9: #e0baf8;
        --palette-purple-10: #f3e4fa;

        --palette-indigo-1: #17172e;
        --palette-indigo-2: #1b1c45;
        --palette-indigo-3: #212558;
        --palette-indigo-4: #262c78;
        --palette-indigo-5: #2d36a1;
        --palette-indigo-6: #343fcb;
        --palette-indigo-7: #5b69e1;
        --palette-indigo-8: #8997f4;
        --palette-indigo-9: #b3bff8;
        --palette-indigo-10: #dce3fa;

        --theme-green-color-rgb-channel: 108, 220, 32;
        --theme-green-background: var(--palette-green-2);

        --theme-red-color-rgb-channel: 210, 69, 37;
        --theme-red-background: var(--palette-red-2);

        --theme-blue-color-rgb-channel: 26, 107, 221;
        --theme-blue-background: var(--palette-blue-2);

        --theme-orange-color-rgb-channel: 197, 116, 11;
        --theme-orange-background: var(--palette-orange-2);

        --theme-cyan-color-rgb-channel: 32, 185, 212;
        --theme-cyan-background: var(--palette-cyan-2);

        --theme-purple-color-rgb-channel: 121, 54, 189;
        --theme-purple-background: var(--palette-purple-2);

        --theme-geekblue-color-rgb-channel: 52, 63, 203;
        --theme-geekblue-background: var(--palette-indigo-2);
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
