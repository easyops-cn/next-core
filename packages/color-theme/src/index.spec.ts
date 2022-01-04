import {
  getStyleByBaseColors,
  getStyleByBrandColor,
  getStyleByVariables,
} from ".";

describe("getStyleByBaseColors", () => {
  it("should work for light theme", () => {
    const style = getStyleByBaseColors(
      "light",
      // Base colors in light theme.
      {
        red: "#f24c25",
        green: "#52c41a",
        blue: "#1a7aff",
        amber: "#f7bf02",
      }
    );
    expect(style).toMatchInlineSnapshot(`
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

        --palette-amber-1: #fffde6;
        --palette-amber-2: #fff6a6;
        --palette-amber-3: #ffee7d;
        --palette-amber-4: #ffe354;
        --palette-amber-5: #ffd52b;
        --palette-amber-6: #f7bf02;
        --palette-amber-7: #d19900;
        --palette-amber-8: #ab7800;
        --palette-amber-9: #855800;
        --palette-amber-10: #5e3c00;
      }"
    `);
  });

  it("should for dark theme", () => {
    const style = getStyleByBaseColors(
      "dark",
      // Base colors in dark theme.
      {
        red: "#f34d27",
        green: "#7bff21",
        blue: "#1a7aff",
        amber: "#f8c004",
      },
      // Base background color in dark theme.
      "#17171a"
    );
    expect(style).toMatchInlineSnapshot(`
      "html[data-theme=\\"dark-v2\\"],
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

        --palette-amber-1: #2d2616;
        --palette-amber-2: #463814;
        --palette-amber-3: #5b4a13;
        --palette-amber-4: #7c6310;
        --palette-amber-5: #a9850c;
        --palette-amber-6: #d6a707;
        --palette-amber-7: #e8c22c;
        --palette-amber-8: #f3d954;
        --palette-amber-9: #f8e87d;
        --palette-amber-10: #faf2a5;
      }"
    `);
  });

  it("should throw for invalid base color names", () => {
    expect(() =>
      getStyleByBaseColors("light", {
        colorBrand: "red",
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"Invalid base color name: \\"colorBrand\\""`
    );
  });
});

describe("getStyleByBrandColor", () => {
  it("should work for light theme", () => {
    const style = getStyleByBrandColor("light", "red");
    expect(style).toMatchInlineSnapshot(`
      ":root,
      [data-override-theme=\\"light\\"] {
        --color-brand: red;
      }"
    `);
  });

  it("should work for dark theme", () => {
    const style = getStyleByBrandColor("dark", "red");
    expect(style).toMatchInlineSnapshot(`
      "html[data-theme=\\"dark-v2\\"],
      [data-override-theme=\\"dark-v2\\"] {
        --color-brand: red;
      }"
    `);
  });

  it("should work in advanced mode for light theme", () => {
    const style = getStyleByBrandColor("light", {
      default: "red-1",
      hover: "red-2",
      active: "red-3",
    });
    expect(style).toMatchInlineSnapshot(`
      ":root,
      [data-override-theme=\\"light\\"] {
        --color-brand: red-1;
        --color-brand-hover: red-2;
        --color-brand-active: red-3;
      }"
    `);
  });

  it("should work in advanced mode for dark theme", () => {
    const style = getStyleByBrandColor("dark", {
      default: "red-1",
      hover: "red-2",
      active: "red-3",
    });
    expect(style).toMatchInlineSnapshot(`
      "html[data-theme=\\"dark-v2\\"],
      [data-override-theme=\\"dark-v2\\"] {
        --color-brand: red-1;
        --color-brand-hover: red-2;
        --color-brand-active: red-3;
      }"
    `);
  });
});

describe("getStyleByVariables", () => {
  it("should work for light theme", () => {
    const style = getStyleByVariables("light", {
      "--color-brand": "red",
      "--palette-blue-6": "darkblue",
    });
    expect(style).toMatchInlineSnapshot(`
      ":root,
      [data-override-theme=\\"light\\"] {
        --color-brand: red;
        --palette-blue-6: darkblue;
      }"
    `);
  });

  it("should work for dark theme", () => {
    const style = getStyleByVariables("dark", {
      "--color-brand": "red",
      "--palette-blue-6": "darkblue",
    });
    expect(style).toMatchInlineSnapshot(`
      "html[data-theme=\\"dark-v2\\"],
      [data-override-theme=\\"dark-v2\\"] {
        --color-brand: red;
        --palette-blue-6: darkblue;
      }"
    `);
  });

  it("should throw for invalid css variable names", () => {
    expect(() =>
      getStyleByVariables("light", {
        "--colorBrand": "red",
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"Invalid css variable name: \\"--colorBrand\\""`
    );
  });
});
