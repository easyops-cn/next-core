import React from "react";
import categories from "./categories";

export interface BrickIconProps {
  icon: string;
  category?: string;
}

function isValidKey(key: string, obj: {}): key is keyof typeof obj {
  return key in obj;
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

  const categoryIcons: Record<string, SvgrComponent> =
    isValidKey(category, categories) && categories[category];

  if (categoryIcons && categoryIcons[props.icon]) {
    return React.createElement(categoryIcons[props.icon], iconProps);
  }

  return null;
};
