import { MicroApp } from "@easyops/brick-types";
import { useRecentApps } from "./useRecentApps";

export function useCurrentApp(): MicroApp {
  return useRecentApps().currentApp;
}
