export interface UserAnalyticsInitOptions {
  gaMeasurementId?: string;
}

let initialized = false;
let gtag: (command: string, ...args: unknown[]) => void;

export const userAnalytics = {
  init(options: UserAnalyticsInitOptions): void {
    if (initialized) {
      // eslint-disable-next-line no-console
      console.info("userAnalytics has been initialized.");

      return;
    }

    const { gaMeasurementId } = options;

    if (gaMeasurementId) {
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
      gtag("config", gaMeasurementId);

      initialized = true;
    }

    if (!initialized) {
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

    gtag?.("event", action, data);

    return true;
  },
  get initialized(): boolean {
    return initialized;
  },
};
