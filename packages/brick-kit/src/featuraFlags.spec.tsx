import React from "react";
import { mount } from "enzyme";
import { getRuntime } from "./runtime";
import {
  DisplayByFeatureFlags,
  FeatureFlagsProvider,
  useFeatureFlags,
} from "./featureFlags";
jest.mock("i18next", () => ({ language: "zh" }));
jest.mock("antd/es/locale/zh_CN", () => "zh_CN");
jest.mock("antd/es/locale/en_US", () => "en_US");

const featureFlags = {
  "enable-feature": true,
  "enable-say-hi": false,
  "enable-say-hello": true,
};

describe("featureFlags", () => {
  let TestWrapper: React.FC<any>;
  beforeEach(() => {
    // eslint-disable-next-line react/display-name
    TestWrapper = (props: any): React.ReactElement => (
      <FeatureFlagsProvider value={featureFlags}>
        {props?.children}
      </FeatureFlagsProvider>
    );
  });

  it("test useFeatureFlags hook", async () => {
    function TestComponent(): React.ReactElement {
      const featureFlags = useFeatureFlags();
      return <>{JSON.stringify(featureFlags)}</>;
    }

    const wrapper = mount(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );
    await (global as any).flushPromises();
    expect(wrapper.text()).toBe(
      JSON.stringify(["enable-feature", "enable-say-hello"])
    );
  });

  it("test useFeatureFlags hook with params", async () => {
    function TestComponent(): React.ReactElement {
      const featureFlags = useFeatureFlags(["enable-feature", "enable-say-hi"]);
      return <>{JSON.stringify(featureFlags)}</>;
    }

    const wrapper = mount(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );
    await (global as any).flushPromises();
    expect(wrapper.text()).toBe(JSON.stringify([true, false]));
  });

  describe("FeatureFlags component", () => {
    it("should show child node when feature enabled", async () => {
      function TestComponent(): React.ReactElement {
        return (
          <>
            <DisplayByFeatureFlags name={"enable-feature"}>
              <div>Can you see me?</div>
            </DisplayByFeatureFlags>
          </>
        );
      }

      const wrapper = mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      await (global as any).flushPromises();
      expect(wrapper.text()).toBe("Can you see me?");
    });

    it("should show child node with multiple feature flags", async () => {
      function TestComponent(): React.ReactElement {
        return (
          <>
            <DisplayByFeatureFlags
              name={["enable-feature", "enable-say-hello"]}
            >
              <div>Can you see me?</div>
            </DisplayByFeatureFlags>
          </>
        );
      }

      const wrapper = mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      await (global as any).flushPromises();
      expect(wrapper.text()).toBe("Can you see me?");
    });

    it("should not show child node when feature not enable", async () => {
      function TestComponent(): React.ReactElement {
        return (
          <>
            <DisplayByFeatureFlags name={"enable-say-hi"}>
              <div>Can you see me?</div>
            </DisplayByFeatureFlags>
          </>
        );
      }

      const wrapper = mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      await (global as any).flushPromises();
      expect(wrapper.text()).toBe("");
    });

    it("should not show child node with multiple feature flags", async () => {
      function TestComponent(): React.ReactElement {
        return (
          <>
            <DisplayByFeatureFlags name={["enable-say-hi", "enable-say-hello"]}>
              <div>Can you see me?</div>
            </DisplayByFeatureFlags>
          </>
        );
      }

      const wrapper = mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      await (global as any).flushPromises();
      expect(wrapper.text()).toBe("");
    });

    it("should show fallback child node when feature not enabled", async () => {
      function TestComponent(): React.ReactElement {
        return (
          <>
            <DisplayByFeatureFlags
              fallback={<h1>Good to see you.</h1>}
              name={"enable-foo"}
            >
              <div>Can you see me?</div>
            </DisplayByFeatureFlags>
          </>
        );
      }

      const wrapper = mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      await (global as any).flushPromises();
      expect(wrapper.text()).toBe("Good to see you.");
    });
  });
});
