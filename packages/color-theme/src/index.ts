import { generate } from "@ant-design/colors";

export function getStyleByBaseColors(
  baseLightColors: BaseColors,
  baseDarkColors: BaseColors,
  backgroundColor: string
): string {
  return [
    getLightStyle(getCssVariableDefinitions(generatePalettes(baseLightColors))),
    getDarkStyle(
      getCssVariableDefinitions(
        generatePalettes(baseDarkColors, "dark", backgroundColor)
      )
    ),
  ].join("\n\n");
}

export interface BaseColors {
  [colorName: string]: string;
}

interface Palettes {
  [colorName: string]: string[];
}

function getLightStyle(cssVariableDefinitions: string): string {
  return `:root,\n[data-override-theme="light"] {\n${cssVariableDefinitions}}`;
}

function getDarkStyle(cssVariableDefinitions: string): string {
  return `html[data-theme="dark-v2"],\n[data-override-theme="dark-v2"] {\n${cssVariableDefinitions}}`;
}

function getCssVariableDefinitions(palettes: Palettes): string {
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

function generatePalettes(
  baseColors: BaseColors,
  theme?: string,
  backgroundColor?: string
): Palettes {
  return Object.fromEntries(
    Object.entries(baseColors).map(([colorName, baseColor]) => [
      colorName,
      generate(
        baseColor,
        theme === "dark"
          ? {
              theme,
              backgroundColor,
            }
          : undefined
      ),
    ])
  );
}
