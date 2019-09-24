import React from "react";
import { defaultCategory, appCategory } from "./categories";

export interface BrickIconProps {
  icon: string;
  category?: string;
}

export const BrickIcon = (props: BrickIconProps): React.ReactElement => {
  const iconProps: Record<string, any> = {
    // Reset width and height.
    width: null,
    height: null,
    className: `easyops-icon easyops-icon-${props.category || "default"}-${
      props.icon
    }`
  };

  let category: Record<string, SvgrComponent>;

  switch (props.category) {
    case undefined:
      category = defaultCategory;
      break;
    case "app":
      category = appCategory;
      break;
  }

  if (category[props.icon]) {
    return React.createElement(category[props.icon], iconProps);
  }

  return null;
};
