const { generate } = require("@ant-design/colors");

function getCssVariableDefinitionsOfPalette(palettes) {
  return Object.entries(palettes)
    .flatMap(([colorName, palette]) =>
      palette
        .map(
          (color, index) => `  --palette-${colorName}-${index + 1}: ${color};`
        )
        // Concat an empty string to make a double-line-break for each group of color name.
        .concat("")
    )
    .join("\n");
}

function getPalettesOfLight(baseColors) {
  return Object.fromEntries(
    Object.entries(baseColors).map(([colorName, baseColor]) => [
      colorName,
      generate(baseColor),
    ])
  );
}

function getPalettesOfDark(baseColors, backgroundColor) {
  return Object.fromEntries(
    Object.entries(baseColors).map(([colorName, baseColor]) => [
      colorName,
      generate(baseColor, {
        theme: "dark",
        backgroundColor,
      }),
    ])
  );
}

function getLightStyle(cssVariableDefinitions) {
  return `:root,\n[data-override-theme="light"] {\n${cssVariableDefinitions}}`;
}

function getDarkStyle(cssVariableDefinitions) {
  return `html[data-theme="dark-v2"],\n[data-override-theme="dark-v2"] {\n${cssVariableDefinitions}}`;
}

function getStyleByBaseColors(
  baseLightColors,
  baseDarkColors,
  backgroundColor
) {
  return [
    getLightStyle(
      getCssVariableDefinitionsOfPalette(getPalettesOfLight(baseLightColors))
    ),
    getDarkStyle(
      getCssVariableDefinitionsOfPalette(
        getPalettesOfDark(baseDarkColors, backgroundColor)
      )
    ),
  ].join("\n\n");
}

exports.getStyleByBaseColors = getStyleByBaseColors;

/*
// Brand colors should be auto generated from a single color.

function getCssVariableDefinitionsOfBrand(color) {
  return ` --color-brand: ${color};`;
}

function getStyleByBrandColor(brandColor, darkBrandColor) {
  return [
    getLightStyle(getCssVariableDefinitionsOfPalette(
      getCssVariableDefinitionsOfBrand(brandColor)
    )),
    getDarkStyle(getCssVariableDefinitionsOfPalette(
      getCssVariableDefinitionsOfBrand(darkBrandColor ?? brandColor)
    )),
  ].join("\n\n");
}
*/
