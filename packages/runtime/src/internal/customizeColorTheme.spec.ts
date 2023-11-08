import { applyColorTheme, customizeColorTheme } from "./customizeColorTheme.js";

const getStyles = () => document.head.querySelectorAll("style");

beforeEach(() => {
  for (const style of getStyles()) {
    style.remove();
  }
});

describe("customizeColorTheme", () => {
  test("no theme settings", () => {
    customizeColorTheme(undefined);
    expect(getStyles().length).toBe(0);
  });

  test("set brand color", () => {
    customizeColorTheme({
      brandColor: {
        light: "red",
        dark: "darkred",
      },
    });

    expect(getStyles().length).toBe(1);
    expect(getStyles()[0].textContent).toMatchInlineSnapshot(`
      ":root,
      [data-override-theme="light"] {
        --color-brand: red;
      }

      html[data-theme="dark-v2"],
      [data-override-theme="dark-v2"] {
        --color-brand: darkred;
      }"
    `);
  });

  test("set base colors", () => {
    customizeColorTheme({
      baseColors: {
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
      },
    });

    expect(getStyles().length).toBe(1);

    expect(getStyles()[0].textContent).toMatchInlineSnapshot(`
      ":root,
      [data-override-theme="light"] {
        --palette-red-1-channel: 255, 245, 240;
        --palette-red-1: rgb(var(--palette-red-1-channel));
        --palette-red-2-channel: 255, 218, 201;
        --palette-red-2: rgb(var(--palette-red-2-channel));
        --palette-red-3-channel: 255, 187, 161;
        --palette-red-3: rgb(var(--palette-red-3-channel));
        --palette-red-4-channel: 255, 154, 120;
        --palette-red-4: rgb(var(--palette-red-4-channel));
        --palette-red-5-channel: 255, 117, 79;
        --palette-red-5: rgb(var(--palette-red-5-channel));
        --palette-red-6-channel: 242, 76, 37;
        --palette-red-6: rgb(var(--palette-red-6-channel));
        --palette-red-7-channel: 204, 48, 20;
        --palette-red-7: rgb(var(--palette-red-7-channel));
        --palette-red-8-channel: 166, 27, 8;
        --palette-red-8: rgb(var(--palette-red-8-channel));
        --palette-red-9-channel: 128, 11, 0;
        --palette-red-9: rgb(var(--palette-red-9-channel));
        --palette-red-10-channel: 89, 4, 0;
        --palette-red-10: rgb(var(--palette-red-10-channel));

        --palette-green-1-channel: 246, 255, 237;
        --palette-green-1: rgb(var(--palette-green-1-channel));
        --palette-green-2-channel: 217, 247, 190;
        --palette-green-2: rgb(var(--palette-green-2-channel));
        --palette-green-3-channel: 183, 235, 143;
        --palette-green-3: rgb(var(--palette-green-3-channel));
        --palette-green-4-channel: 149, 222, 100;
        --palette-green-4: rgb(var(--palette-green-4-channel));
        --palette-green-5-channel: 115, 209, 61;
        --palette-green-5: rgb(var(--palette-green-5-channel));
        --palette-green-6-channel: 82, 196, 26;
        --palette-green-6: rgb(var(--palette-green-6-channel));
        --palette-green-7-channel: 56, 158, 13;
        --palette-green-7: rgb(var(--palette-green-7-channel));
        --palette-green-8-channel: 35, 120, 4;
        --palette-green-8: rgb(var(--palette-green-8-channel));
        --palette-green-9-channel: 19, 82, 0;
        --palette-green-9: rgb(var(--palette-green-9-channel));
        --palette-green-10-channel: 9, 43, 0;
        --palette-green-10: rgb(var(--palette-green-10-channel));

        --palette-blue-1-channel: 230, 244, 255;
        --palette-blue-1: rgb(var(--palette-blue-1-channel));
        --palette-blue-2-channel: 189, 225, 255;
        --palette-blue-2: rgb(var(--palette-blue-2-channel));
        --palette-blue-3-channel: 148, 203, 255;
        --palette-blue-3: rgb(var(--palette-blue-3-channel));
        --palette-blue-4-channel: 107, 179, 255;
        --palette-blue-4: rgb(var(--palette-blue-4-channel));
        --palette-blue-5-channel: 66, 151, 255;
        --palette-blue-5: rgb(var(--palette-blue-5-channel));
        --palette-blue-6-channel: 26, 122, 255;
        --palette-blue-6: rgb(var(--palette-blue-6-channel));
        --palette-blue-7-channel: 11, 90, 217;
        --palette-blue-7: rgb(var(--palette-blue-7-channel));
        --palette-blue-8-channel: 0, 62, 179;
        --palette-blue-8: rgb(var(--palette-blue-8-channel));
        --palette-blue-9-channel: 0, 44, 140;
        --palette-blue-9: rgb(var(--palette-blue-9-channel));
        --palette-blue-10-channel: 0, 29, 102;
        --palette-blue-10: rgb(var(--palette-blue-10-channel));

        --palette-cyan-1-channel: 240, 255, 255;
        --palette-cyan-1: rgb(var(--palette-cyan-1-channel));
        --palette-cyan-2-channel: 199, 254, 255;
        --palette-cyan-2: rgb(var(--palette-cyan-2-channel));
        --palette-cyan-3-channel: 158, 250, 255;
        --palette-cyan-3: rgb(var(--palette-cyan-3-channel));
        --palette-cyan-4-channel: 117, 244, 255;
        --palette-cyan-4: rgb(var(--palette-cyan-4-channel));
        --palette-cyan-5-channel: 77, 234, 255;
        --palette-cyan-5: rgb(var(--palette-cyan-5-channel));
        --palette-cyan-6-channel: 33, 212, 243;
        --palette-cyan-6: rgb(var(--palette-cyan-6-channel));
        --palette-cyan-7-channel: 18, 170, 204;
        --palette-cyan-7: rgb(var(--palette-cyan-7-channel));
        --palette-cyan-8-channel: 7, 131, 166;
        --palette-cyan-8: rgb(var(--palette-cyan-8-channel));
        --palette-cyan-9-channel: 0, 96, 128;
        --palette-cyan-9: rgb(var(--palette-cyan-9-channel));
        --palette-cyan-10-channel: 0, 64, 89;
        --palette-cyan-10: rgb(var(--palette-cyan-10-channel));

        --palette-orange-1-channel: 255, 248, 230;
        --palette-orange-1: rgb(var(--palette-orange-1-channel));
        --palette-orange-2-channel: 255, 230, 171;
        --palette-orange-2: rgb(var(--palette-orange-2-channel));
        --palette-orange-3-channel: 255, 213, 130;
        --palette-orange-3: rgb(var(--palette-orange-3-channel));
        --palette-orange-4-channel: 252, 192, 88;
        --palette-orange-4: rgb(var(--palette-orange-4-channel));
        --palette-orange-5-channel: 240, 162, 46;
        --palette-orange-5: rgb(var(--palette-orange-5-channel));
        --palette-orange-6-channel: 227, 131, 6;
        --palette-orange-6: rgb(var(--palette-orange-6-channel));
        --palette-orange-7-channel: 189, 101, 0;
        --palette-orange-7: rgb(var(--palette-orange-7-channel));
        --palette-orange-8-channel: 150, 75, 0;
        --palette-orange-8: rgb(var(--palette-orange-8-channel));
        --palette-orange-9-channel: 112, 52, 0;
        --palette-orange-9: rgb(var(--palette-orange-9-channel));
        --palette-orange-10-channel: 74, 32, 0;
        --palette-orange-10: rgb(var(--palette-orange-10-channel));

        --palette-purple-1-channel: 250, 240, 255;
        --palette-purple-1: rgb(var(--palette-purple-1-channel));
        --palette-purple-2-channel: 247, 232, 255;
        --palette-purple-2: rgb(var(--palette-purple-2-channel));
        --palette-purple-3-channel: 230, 191, 255;
        --palette-purple-3: rgb(var(--palette-purple-3-channel));
        --palette-purple-4-channel: 199, 143, 242;
        --palette-purple-4: rgb(var(--palette-purple-4-channel));
        --palette-purple-5-channel: 168, 99, 230;
        --palette-purple-5: rgb(var(--palette-purple-5-channel));
        --palette-purple-6-channel: 137, 58, 216;
        --palette-purple-6: rgb(var(--palette-purple-6-channel));
        --palette-purple-7-channel: 104, 39, 179;
        --palette-purple-7: rgb(var(--palette-purple-7-channel));
        --palette-purple-8-channel: 74, 24, 140;
        --palette-purple-8: rgb(var(--palette-purple-8-channel));
        --palette-purple-9-channel: 48, 12, 102;
        --palette-purple-9: rgb(var(--palette-purple-9-channel));
        --palette-purple-10-channel: 28, 7, 64;
        --palette-purple-10: rgb(var(--palette-purple-10-channel));

        --palette-indigo-1-channel: 240, 243, 255;
        --palette-indigo-1: rgb(var(--palette-indigo-1-channel));
        --palette-indigo-2-channel: 224, 231, 255;
        --palette-indigo-2: rgb(var(--palette-indigo-2-channel));
        --palette-indigo-3-channel: 184, 196, 255;
        --palette-indigo-3: rgb(var(--palette-indigo-3-channel));
        --palette-indigo-4-channel: 143, 158, 255;
        --palette-indigo-4: rgb(var(--palette-indigo-4-channel));
        --palette-indigo-5-channel: 98, 113, 245;
        --palette-indigo-5: rgb(var(--palette-indigo-5-channel));
        --palette-indigo-6-channel: 56, 68, 232;
        --palette-indigo-6: rgb(var(--palette-indigo-6-channel));
        --palette-indigo-7-channel: 37, 42, 194;
        --palette-indigo-7: rgb(var(--palette-indigo-7-channel));
        --palette-indigo-8-channel: 22, 22, 156;
        --palette-indigo-8: rgb(var(--palette-indigo-8-channel));
        --palette-indigo-9-channel: 14, 11, 117;
        --palette-indigo-9: rgb(var(--palette-indigo-9-channel));
        --palette-indigo-10-channel: 11, 6, 79;
        --palette-indigo-10: rgb(var(--palette-indigo-10-channel));

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

      html[data-theme="dark-v2"],
      [data-override-theme="dark-v2"] {
        --palette-red-1-channel: 44, 24, 24;
        --palette-red-2-channel: 68, 30, 25;
        --palette-red-3-channel: 89, 39, 30;
        --palette-red-4-channel: 122, 47, 32;
        --palette-red-5-channel: 166, 58, 34;
        --palette-red-6-channel: 210, 69, 37;
        --palette-red-7-channel: 232, 109, 76;
        --palette-red-8-channel: 243, 149, 117;
        --palette-red-9-channel: 248, 184, 159;
        --palette-red-10-channel: 250, 216, 200;

        --palette-green-1-channel: 29, 46, 23;
        --palette-green-2-channel: 40, 72, 24;
        --palette-green-3-channel: 53, 93, 28;
        --palette-green-4-channel: 68, 127, 29;
        --palette-green-5-channel: 88, 174, 31;
        --palette-green-6-channel: 108, 220, 32;
        --palette-green-7-channel: 139, 232, 69;
        --palette-green-8-channel: 172, 243, 111;
        --palette-green-9-channel: 200, 248, 152;
        --palette-green-10-channel: 224, 250, 193;

        --palette-blue-1-channel: 20, 29, 49;
        --palette-blue-2-channel: 20, 40, 74;
        --palette-blue-3-channel: 24, 53, 95;
        --palette-blue-4-channel: 24, 68, 129;
        --palette-blue-5-channel: 25, 87, 175;
        --palette-blue-6-channel: 26, 107, 221;
        --palette-blue-7-channel: 62, 138, 232;
        --palette-blue-8-channel: 103, 171, 244;
        --palette-blue-9-channel: 144, 198, 248;
        --palette-blue-10-channel: 186, 221, 250;

        --palette-cyan-1-channel: 20, 40, 47;
        --palette-cyan-2-channel: 22, 60, 71;
        --palette-cyan-3-channel: 26, 80, 92;
        --palette-cyan-4-channel: 28, 109, 125;
        --palette-cyan-5-channel: 30, 147, 168;
        --palette-cyan-6-channel: 32, 185, 212;
        --palette-cyan-7-channel: 69, 213, 232;
        --palette-cyan-8-channel: 110, 232, 244;
        --palette-cyan-9-channel: 152, 243, 248;
        --palette-cyan-10-channel: 193, 249, 250;

        --palette-orange-1-channel: 42, 31, 22;
        --palette-orange-2-channel: 65, 43, 20;
        --palette-orange-3-channel: 85, 56, 21;
        --palette-orange-4-channel: 115, 72, 18;
        --palette-orange-5-channel: 156, 94, 14;
        --palette-orange-6-channel: 197, 116, 11;
        --palette-orange-7-channel: 218, 149, 46;
        --palette-orange-8-channel: 241, 185, 88;
        --palette-orange-9-channel: 248, 208, 130;
        --palette-orange-10-channel: 250, 227, 170;

        --palette-purple-1-channel: 31, 23, 43;
        --palette-purple-2-channel: 43, 27, 64;
        --palette-purple-3-channel: 58, 34, 84;
        --palette-purple-4-channel: 75, 39, 112;
        --palette-purple-5-channel: 98, 46, 151;
        --palette-purple-6-channel: 121, 54, 189;
        --palette-purple-7-channel: 154, 91, 210;
        --palette-purple-8-channel: 190, 137, 231;
        --palette-purple-9-channel: 224, 186, 248;
        --palette-purple-10-channel: 243, 228, 250;

        --palette-indigo-1-channel: 23, 23, 46;
        --palette-indigo-2-channel: 27, 28, 69;
        --palette-indigo-3-channel: 33, 37, 88;
        --palette-indigo-4-channel: 38, 44, 120;
        --palette-indigo-5-channel: 45, 54, 161;
        --palette-indigo-6-channel: 52, 63, 203;
        --palette-indigo-7-channel: 91, 105, 225;
        --palette-indigo-8-channel: 137, 151, 244;
        --palette-indigo-9-channel: 179, 191, 248;
        --palette-indigo-10-channel: 220, 227, 250;

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
  });

  test("set variables", () => {
    customizeColorTheme({
      variables: {
        light: {
          "--color-brand": "red",
          "--palette-blue-6": "blue",
        },
        dark: {
          "--color-brand": "darkred",
          "--palette-blue-6": "darkblue",
        },
      },
    });

    expect(getStyles().length).toBe(1);
    expect(getStyles()[0].textContent).toMatchInlineSnapshot(`
      ":root,
      [data-override-theme="light"] {
        --color-brand: red;
        --palette-blue-6: blue;
      }

      html[data-theme="dark-v2"],
      [data-override-theme="dark-v2"] {
        --color-brand: darkred;
        --palette-blue-6: darkblue;
      }"
    `);
  });

  test("unknown theme settings", () => {
    customizeColorTheme({});
    expect(getStyles().length).toBe(0);
  });
});

describe("applyColorTheme", () => {
  test("set light only brand color", () => {
    const undo = applyColorTheme({
      type: "brandColor",
      light: "red",
    });

    expect(getStyles().length).toBe(1);
    expect(getStyles()[0].textContent).toMatchInlineSnapshot(`
      ":root,
      [data-override-theme="light"] {
        --color-brand: red;
      }"
    `);

    undo?.();
    expect(getStyles().length).toBe(0);
  });

  test("set dark only brand color", () => {
    const undo = applyColorTheme({
      type: "brandColor",
      dark: "darkred",
    });

    expect(getStyles().length).toBe(1);
    expect(getStyles()[0].textContent).toMatchInlineSnapshot(`
      "html[data-theme="dark-v2"],
      [data-override-theme="dark-v2"] {
        --color-brand: darkred;
      }"
    `);

    undo?.();
    expect(getStyles().length).toBe(0);
  });

  test("does nothing for unknown type", () => {
    const undo = applyColorTheme({
      type: "unknown" as any,
      light: "red",
    });
    expect(getStyles.length).toBe(0);
    expect(undo).toBe(undefined);
  });
});
