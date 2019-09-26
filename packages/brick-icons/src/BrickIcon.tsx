import React from "react";
import { defaultCategory, appCategory } from "./categories";

export interface BrickIconProps {
  icon: string;
  category?: string;
}

export const BrickIcon = (props: BrickIconProps): React.ReactElement => {
  const category = props.category || "default";

  const iconProps: Record<string, any> = {
    // Reset width and height.
    width: null,
    height: null,
    className: `easyops-icon easyops-icon-${category || "default"}-${
      props.icon
    }`
  };

  let categoryIcons: Record<string, SvgrComponent>;

  switch (category) {
    case "default":
      categoryIcons = defaultCategory;
      break;
    case "app":
      categoryIcons = appCategory;
      break;
  }

  if (categoryIcons && categoryIcons[props.icon]) {
    return React.createElement(categoryIcons[props.icon], iconProps);
  }

  return null;
};
