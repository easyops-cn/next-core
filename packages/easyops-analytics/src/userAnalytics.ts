export interface UserAnalyticsInitOptions {
  gaMeasurementId?: string;
  sendPageView?: boolean;
  userId?: string;
  debugMode?: boolean;
}

let initialized = false;
let gtag: (command: string, ...args: unknown[]) => void;

export const userAnalytics = {
  init(options: UserAnalyticsInitOptions): void {
    const { gaMeasurementId, sendPageView = true, userId, debugMode } = options;
    let initSuccess = false;

    if (gaMeasurementId) {
      if (!gtag) {
        const gtagScript = document.createElement("script");

        // Global site tag (gtag.js) - Google Analytics
        gtagScript.setAttribute("async", "");
        gtagScript.setAttribute(
          "src",
          `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`
        );
        document.head.append(gtagScript);

        window.dataLayer = window.dataLayer || [];
        gtag = function () {
          // eslint-disable-next-line prefer-rest-params
          window.dataLayer.push(arguments);
        };

        gtag("js", new Date());
      }

      gtag("config", gaMeasurementId, {
        send_page_view: sendPageView,
        debug_mode: debugMode,
      });

      initSuccess = true;
    }

    if (initSuccess) {
      initialized = true;
      userAnalytics.setUserId(userId);
    } else {
      // eslint-disable-next-line no-console
      console.error(
        "Initialization failed. Please pass gaMeasurementId in the options."
      );
    }
  },
  event(action: string, data?: Record<string, unknown>): boolean {
    if (!initialized) {
      return false;
    }

    gtag("event", action, data);

    return true;
  },
  setUserId(userId?: string): boolean {
    if (!initialized) {
      return false;
    }

    gtag("set", "user_properties", {
      user_id: userId ?? "",
    });

    return true;
  },
  get initialized(): boolean {
    return initialized;
  },
};
