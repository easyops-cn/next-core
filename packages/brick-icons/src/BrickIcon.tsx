import React from "react";
import { defaultCategory, appCategory } from "./categories";

export type BrickIconCategory = "app";

interface BrickIconPropsOfDefault {
  icon: keyof typeof defaultCategory;
  category?: undefined;
}

interface BrickIconPropsOfApp {
  icon: keyof typeof appCategory;
  category: BrickIconCategory;
}

export type BrickIconProps = BrickIconPropsOfDefault | BrickIconPropsOfApp;

export const BrickIcon = (props: BrickIconProps): React.ReactElement => {
  const iconProps: Record<string, any> = {
    // Reset width and height.
    width: null,
    height: null,
    className: `easyops-icon easyops-icon-${props.category || "default"}-${
      props.icon
    }`
  };

  let icon: SvgrComponent;

  switch (props.category) {
    case undefined:
      icon = defaultCategory[(props as BrickIconPropsOfDefault).icon];
      break;
    case "app":
      icon = appCategory[(props as BrickIconPropsOfApp).icon];
      break;
  }

  if (icon) {
    return React.createElement(icon, iconProps);
  }

  return null;
};
