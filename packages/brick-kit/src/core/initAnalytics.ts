import { userAnalytics } from "@next-core/easyops-analytics";
import { getAuth } from "../auth";
import { getRuntime } from "../runtime";

/** @internal */
export function initAnalytics(): void {
  const misc = getRuntime().getMiscSettings();
  const { gaMeasurementId, analyticsDebugMode } = misc as {
    gaMeasurementId?: string;
    analyticsDebugMode?: boolean;
  };

  if (gaMeasurementId) {
    userAnalytics.init({
      gaMeasurementId,
      sendPageView: false,
      userId: getAuth().userInstanceId,
      debugMode: analyticsDebugMode,
    });
  }
}
