import React from "react";
import i18n from "i18next";
import { ConfigProvider } from "antd";
import zhCN from "antd/es/locale/zh_CN";
import enUS from "antd/es/locale/en_US";

import { ErrorBoundary } from "./ErrorBoundary";
import { EasyopsEmpty, EasyopsEmptyProps } from "./EasyopsEmpty";
import { FeatureFlagsProvider } from "./featureFlags";
import { getRuntime } from "./runtime";

interface BrickWrapperProps {
  children?: React.ReactElement;
  wrapperConfig?: {
    empty?: EasyopsEmptyProps;
  };
}

/**
 * 构件的 React 组件包装器，包含 ErrorBoundary, ConfigProvider, FeatureFlagsProvider。
 */
export function BrickWrapper(props: BrickWrapperProps): React.ReactElement {
  const locale =
    i18n.language && i18n.language.split("-")[0] === "en" ? enUS : zhCN;
  const featureFlags = getRuntime().getFeatureFlags();
  return (
    <ErrorBoundary>
      <FeatureFlagsProvider value={featureFlags}>
        <ConfigProvider
          locale={locale}
          autoInsertSpaceInButton={false}
          renderEmpty={() => <EasyopsEmpty {...props.wrapperConfig?.empty} />}
        >
          {props.children}
        </ConfigProvider>
      </FeatureFlagsProvider>
    </ErrorBoundary>
  );
}
