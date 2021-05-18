import React from "react";
import categories from "./generated/categories";

export interface BrickIconProps {
  icon: string;
  category?: string;
}

export const BrickIcon = ({
  category,
  icon,
}: BrickIconProps): React.ReactElement => {
  const actualCategory = category || "default";

  const [iconComponent, setIconComponent] = React.useState<SvgrComponent>();

  React.useEffect(() => {
    (async () => {
      const loadCategory = categories[actualCategory];
      if (typeof loadCategory === "function") {
        const categoryIcons = await loadCategory();
        setIconComponent(() => categoryIcons[icon]);
      }
    })();
  }, [icon, actualCategory]);

  return iconComponent
    ? React.createElement(iconComponent, {
        // Reset width and height.
        width: null,
        height: null,
        className: `easyops-icon easyops-icon-${actualCategory}-${icon}`,
      })
    : null;
};
