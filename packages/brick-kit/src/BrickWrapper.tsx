import React from "react";
import i18n from "i18next";
import { ConfigProvider } from "antd";
import zhCN from "antd/es/locale/zh_CN";
import enUS from "antd/es/locale/en_US";

import { ErrorBoundary } from "./ErrorBoundary";

interface BrickWrapperProps {
  children?: React.ReactElement;
}

export const BrickWrapper = (props: BrickWrapperProps): React.ReactElement => {
  const locale = i18n.language === "zh" ? zhCN : enUS;
  return (
    <ErrorBoundary>
      <ConfigProvider locale={locale}>{props.children}</ConfigProvider>
    </ErrorBoundary>
  );
};
