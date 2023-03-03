import { getCurrentTheme } from "@next-core/runtime";
import type { SiteTheme } from "@next-core/types";
import { useEffect, useState } from "react";

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
