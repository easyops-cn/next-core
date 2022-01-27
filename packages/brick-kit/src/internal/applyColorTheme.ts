import {
  BaseColors,
  BrandColor,
  getStyleByBaseColors,
  getStyleByBrandColor,
  getStyleByVariables,
} from "@next-core/color-theme";

export type ColorThemeOptions =
  | ColorThemeOptionsByBrand
  | ColorThemeOptionsByBaseColors
  | ColorThemeOptionsByVariables;

export interface ColorThemeOptionsByBrand {
  type: "brandColor";
  light?: BrandColor;
  dark?: BrandColor;
}

export interface ColorThemeOptionsByBaseColors {
  type: "baseColors";
  light?: BaseColors;
  dark?: BaseColors;
  backgroundColor?: string;
}

export interface ColorThemeOptionsByVariables {
  type: "variables";
  light?: Record<string, string>;
  dark?: Record<string, string>;
}

export function applyColorTheme(options: ColorThemeOptions): () => void {
  const style: string[] = [];
  const themes = ["light", "dark"] as const;
  themes.forEach((theme) => {
    if (options[theme]) {
      switch (options.type) {
        case "brandColor":
          style.push(getStyleByBrandColor(theme, options[theme]));
          break;
        case "baseColors":
          style.push(
            getStyleByBaseColors(theme, options[theme], options.backgroundColor)
          );
          break;
        case "variables":
          style.push(getStyleByVariables(theme, options[theme]));
          break;
      }
    }
  });

  if (style.length > 0) {
    const element = document.createElement("style");
    element.textContent = style.join("\n\n");
    document.head.appendChild(element);
    return () => {
      element.remove();
    };
  }
}
