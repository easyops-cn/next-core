import type { SiteMode, SiteTheme } from "@next-core/types";
import { JsonStorage } from "@next-core/utils/general";

interface AppThemes {
  [appId: string]: SiteTheme;
}

// Themes.
let theme: SiteTheme = "light";
const storage = new JsonStorage<Record<string, AppThemes>>(localStorage);
const LOCAL_STORAGE_APPS_THEME_KEY = "apps-theme";

export function setTheme(value: SiteTheme): void {
  if (value !== "dark" && value !== "light" && value !== "dark-v2") {
    throw new Error(`Unsupported theme: ${value}`);
  }
  theme = value;
}

export function getTheme(): SiteTheme {
  return theme;
}

export function getCurrentTheme(): SiteTheme {
  return document.documentElement.dataset.theme as SiteTheme;
}

export function applyTheme(value?: SiteTheme): void {
  if (value) {
    setTheme(value);
  } else {
    value = getTheme();
  }
  if (value !== getCurrentTheme()) {
    document.documentElement.dataset.theme = value;
    window.dispatchEvent(
      new CustomEvent<SiteTheme>("theme.change", {
        detail: value,
      })
    );
  }
}

export function batchSetAppsLocalTheme(appsTheme: AppThemes): void {
  storage.setItem(LOCAL_STORAGE_APPS_THEME_KEY, {
    ...getLocalAppsTheme(),
    ...appsTheme,
  });
}

export function getLocalAppsTheme(): AppThemes {
  let result: AppThemes | undefined;
  try {
    result = storage.getItem(LOCAL_STORAGE_APPS_THEME_KEY);
  } catch {
    // eslint-disable-next-line no-console
    console.error("JSON parse error inside `getLocalAppsTheme()`");
  }

  return result ?? {};
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

export function getCurrentMode(): SiteMode {
  return document.documentElement.dataset.mode as SiteMode;
}

export function applyMode(value?: SiteMode): void {
  if (value) {
    setMode(value);
  } else {
    value = getMode();
  }
  if (value !== getCurrentMode()) {
    document.documentElement.dataset.mode = value;
    window.dispatchEvent(
      new CustomEvent<SiteMode>("mode.change", {
        detail: value,
      })
    );
  }
}

export function getCssPropertyValue(
  name: string,
  el = document.documentElement
): string {
  if (!el) return "";
  return window.getComputedStyle(el)?.getPropertyValue(name) || "";
}
