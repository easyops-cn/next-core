import { generate } from "@ant-design/colors";

export function getStyleByBaseColors(
  theme: ThemeType,
  baseColors: BaseColors,
  backgroundColor?: string
): string {
  return (theme === "dark" ? getDarkStyle : getLightStyle)(
    `${getCssVariableDefinitionsByPalettes(
      generatePalettes(baseColors, theme, backgroundColor)
    )}\n${getMigratedCssVariableDefinitions(
      theme,
      baseColors,
      backgroundColor
    )}`
  );
}

export function getStyleByBrandColor(
  theme: ThemeType,
  brandColor: BrandColor
): string {
  return (theme === "dark" ? getDarkStyle : getLightStyle)(
    getCssVariableDefinitionsByBrand(brandColor)
  );
}

export function getStyleByVariables(
  theme: ThemeType,
  variables: Record<string, string>
): string {
  return (theme === "dark" ? getDarkStyle : getLightStyle)(
    getCssVariableDefinitionsByVariables(variables)
  );
}

export type ThemeType = "light" | "dark";

export interface BaseColors {
  [colorName: string]: string;
}

export type BrandColor = string | BrandColorAdvanced;

export interface BrandColorAdvanced {
  default: string;
  hover: string;
  active: string;
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

function getCssVariableDefinitionsByPalettes(palettes: Palettes): string {
  return Object.entries(palettes)
    .flatMap(([colorName, palette]) => {
      ensureBaseColorName(colorName);
      return (
        palette
          .map(
            (color, index) => `  --palette-${colorName}-${index + 1}: ${color};`
          )
          // Concat an empty string to make a double-line-break for each group of color name.
          .concat("")
      );
    })
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

function getCssVariableDefinitionsByBrand(color: BrandColor): string {
  if (typeof color === "string") {
    return `  --color-brand: ${color};\n`;
  }
  return [
    `  --color-brand: ${color.default};`,
    `  --color-brand-hover: ${color.hover};`,
    `  --color-brand-active: ${color.active};`,
    "",
  ].join("\n");
}

function getCssVariableDefinitionsByVariables(
  variables: Record<string, string>
): string {
  return Object.entries(variables)
    .map(([name, color]) => {
      ensureCssVariableName(name);
      return `  ${name}: ${color};`;
    })
    .concat("")
    .join("\n");
}

function ensureCssVariableName(name: string): void {
  if (!/^--[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error(`Invalid css variable name: ${JSON.stringify(name)}`);
  }
}

function ensureBaseColorName(name: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error(`Invalid base color name: ${JSON.stringify(name)}`);
  }
}

function getMigratedCssVariableDefinitions(
  theme: ThemeType,
  baseColors: BaseColors,
  backgroundColor?: string
): string {
  const migrateMap = {
    green: "green",
    red: "red",
    blue: "blue",
    orange: "orange",
    cyan: "cyan",
    purple: "purple",
    geekblue: "indigo",
  };

  return Object.entries(migrateMap)
    .flatMap(([legacyColorName, newColorName]) => [
      `  --theme-${legacyColorName}-color-rgb-channel: ${getRgbChannel(
        getActualBaseColor(baseColors[newColorName], theme, backgroundColor)
      )};`,
      ...(theme === "dark"
        ? []
        : [
            `  --theme-${legacyColorName}-color: var(--palette-${newColorName}-6);`,
            `  --theme-${legacyColorName}-border-color: var(--palette-${newColorName}-3);`,
          ]),
      `  --theme-${legacyColorName}-background: var(--palette-${newColorName}-${
        theme === "dark" ? 2 : 1
      });`,
      "",
    ])
    .join("\n");
}

function getRgbChannel(color: string): string {
  return color
    .match(/[0-9a-fA-F]{2}/g)
    .map((hex) => parseInt(hex, 16))
    .join(", ");
}

function getActualBaseColor(
  baseColor: string,
  theme: ThemeType,
  backgroundColor?: string
): string {
  return theme === "dark"
    ? generate(baseColor, { theme, backgroundColor })[5]
    : baseColor;
}
