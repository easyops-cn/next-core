import { userAnalytics } from "@next-core/easyops-analytics";
import { initAnalytics } from "./initAnalytics";
import { getRuntime } from "../runtime";
import { getAuth } from "../auth";

jest.mock("../runtime");
jest.mock("../auth");

const mockGetMiscSettings = jest.fn(() => ({}));
const mockGetAuth = getAuth as jest.Mock;
const sypOnUserAnalyticsInit = jest.spyOn(userAnalytics, "init");

(getRuntime as jest.Mock).mockImplementation(() => ({
  getMiscSettings: mockGetMiscSettings,
}));

describe("initAnalytics", () => {
  it("should work", () => {
    const gaMeasurementId = "GA-MEASUREMENT-ID";
    const analyticsDebugMode = true;
    const userInstanceId = "user-instance-id";

    initAnalytics();
    expect(sypOnUserAnalyticsInit).not.toBeCalled();

    mockGetMiscSettings.mockReturnValue({
      gaMeasurementId,
      analyticsDebugMode,
    });
    mockGetAuth.mockReturnValueOnce({ userInstanceId });

    initAnalytics();
    expect(sypOnUserAnalyticsInit).toBeCalledWith({
      gaMeasurementId,
      sendPageView: false,
      userId: userInstanceId,
      debugMode: analyticsDebugMode,
    });
  });
});
