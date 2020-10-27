import { useEffect, useState } from "react";
import { SiteMode, SiteTheme } from "@easyops/brick-types";

// Themes.
const DEFAULT_THEME = "light";
let theme: SiteTheme = DEFAULT_THEME;

export function setTheme(value: SiteTheme): void {
  if (value !== "dark" && value !== "light") {
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

export function useCurrentTheme(): SiteTheme {
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());

  useEffect(() => {
    const listenToThemeChange = (event: Event): void => {
      setCurrentTheme((event as CustomEvent<SiteTheme>).detail);
    };
    window.addEventListener("theme.change", listenToThemeChange);
    return () => {
      window.removeEventListener("theme.change", listenToThemeChange);
    };
  }, []);

  return currentTheme;
}

// Modes.
const DEFAULT_MODE = "default";
let mode: SiteMode = DEFAULT_MODE;

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

export function useCurrentMode(): SiteMode {
  const [currentMode, setCurrentMode] = useState(getCurrentMode());

  useEffect(() => {
    const listenToModeChange = (event: Event): void => {
      setCurrentMode((event as CustomEvent<SiteMode>).detail);
    };
    window.addEventListener("mode.change", listenToModeChange);
    return () => {
      window.removeEventListener("mode.change", listenToModeChange);
    };
  }, []);

  return currentMode;
}
