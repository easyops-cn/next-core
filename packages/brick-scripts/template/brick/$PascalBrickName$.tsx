import React from "react";
import { useTranslation } from "react-i18next";
import { NS_$CONSTANT_PACKAGE_NAME$, K } from "../i18n/constants";

export function $PascalBrickName$(): React.ReactElement {
  const { t } = useTranslation(NS_$CONSTANT_PACKAGE_NAME$);

  return <div>{t(K.$CONSTANT_PACKAGE_NAME$)} works!</div>;
}
