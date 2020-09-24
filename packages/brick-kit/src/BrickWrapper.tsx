import React from "react";
import i18n from "i18next";
import { ConfigProvider } from "antd";
import zhCN from "antd/es/locale/zh_CN";
import enUS from "antd/es/locale/en_US";

import { ErrorBoundary } from "./ErrorBoundary";
import { renderEasyopsEmpty } from "./EasyopsEmpty";

interface BrickWrapperProps {
  children?: React.ReactElement;
}

/**
 * 构件的 React 组件包装器，包含 ErrorBoundary 和 ConfigProvider。
 */
export function BrickWrapper(props: BrickWrapperProps): React.ReactElement {
  const locale =
    i18n.language && i18n.language.split("-")[0] === "en" ? enUS : zhCN;
  return (
    <ErrorBoundary>
      <ConfigProvider
        locale={locale}
        autoInsertSpaceInButton={false}
        renderEmpty={renderEasyopsEmpty}
      >
        {props.children}
      </ConfigProvider>
    </ErrorBoundary>
  );
}
