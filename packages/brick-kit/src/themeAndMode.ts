// Themes.

import { SiteMode, SiteTheme } from "@easyops/brick-types";

let theme: SiteTheme = "light";

export function setTheme(value: SiteTheme): void {
  if (value !== "dark" && value !== "light") {
    throw new Error(`Unsupported theme: ${value}`);
  }
  theme = value;
}

export function getTheme(): SiteTheme {
  return theme;
}

export function applyTheme(value?: SiteTheme): void {
  if (value) {
    setTheme(value);
  } else {
    value = getTheme();
  }
  document.documentElement.dataset.theme = value;
}

// Modes.

let mode: SiteMode = "default";

export function setMode(value: SiteMode): void {
  if (value !== "dashboard" && value !== "default") {
    throw new Error(`Unsupported mode: ${value}`);
  }
  mode = value;
}

export function getMode(): SiteMode {
  return mode;
}

export function applyMode(value?: SiteMode): void {
  if (value) {
    setMode(value);
  } else {
    value = getMode();
  }
  document.documentElement.dataset.mode = value;
}
