import { useEffect, useState } from "react";
import { getRuntime } from "@next-core/runtime";
import type { BreadcrumbItemConf } from "@next-core/types";

export interface NavConfig {
  breadcrumb?: BreadcrumbItemConf[];
}

export function useNavConfig(): NavConfig | undefined {
  const [navConfig, setNavConfig] = useState<NavConfig | undefined>(() =>
    getRuntime().getNavConfig()
  );

  useEffect(() => {
    const listener = ((event: CustomEvent<NavConfig | undefined>) => {
      setNavConfig(event.detail);
    }) as EventListener;
    window.addEventListener("navConfig.change", listener);
    return () => window.removeEventListener("navConfig.change", listener);
  }, []);

  return navConfig;
}
