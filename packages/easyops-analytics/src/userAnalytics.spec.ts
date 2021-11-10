import { userAnalytics } from "./userAnalytics";

describe("userAnalytics", () => {
  const sypOnConsoleError = jest.spyOn(console, "error");
  const sypOnConsoleInfo = jest.spyOn(console, "info");
  const gaMeasurementId = "GA-MEASUREMENT-ID";
  const sendPageView = false;
  const userId = "user-id";
  const debugMode = true;
  const action = "action";
  const data = { prop1: 123 };

  it("should output error message in console when call event() before init()", () => {
    expect(userAnalytics.event(action, data)).toBe(false);
  });

  it("should output error message in console when call init() without gaMeasurementId option", () => {
    userAnalytics.init({});
    expect(sypOnConsoleError).toBeCalledWith(
      "Initialization failed. Please pass gaMeasurementId in the options."
    );
  });

  it("should work", () => {
    userAnalytics.init({ gaMeasurementId, sendPageView, userId, debugMode });

    const gtagScript = document.head.querySelector("script:last-child");

    expect(gtagScript.getAttribute("async")).toBe("");
    expect(gtagScript.getAttribute("src")).toBe(
      `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`
    );
    expect(window.dataLayer[0][0]).toBe("js");
    expect(window.dataLayer[0][1]).toBeInstanceOf(Date);
    expect([...window.dataLayer[1]]).toEqual([
      "config",
      gaMeasurementId,
      { send_page_view: sendPageView, user_id: userId, debug_mode: debugMode },
    ]);

    const result = userAnalytics.event(action, data);
    const lastIndex = window.dataLayer.length - 1;
    expect(result).toBe(true);
    expect([...window.dataLayer[lastIndex]]).toEqual(["event", action, data]);
  });

  it("should skip initialization when already initialized", () => {
    userAnalytics.init({ gaMeasurementId });
    expect(sypOnConsoleInfo).toBeCalledWith(
      "userAnalytics has been initialized."
    );
  });
});
