import React from "react";
import { hasOwnProperty } from "@next-core/brick-utils";
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
      let component: SvgrComponent;
      // Avoid prototype collisions, such as `actualCategory: "toString"`.
      if (hasOwnProperty(categories, actualCategory)) {
        let categoryIcons: Record<string, SvgrComponent> = {};
        try {
          categoryIcons = await categories[actualCategory]();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Load icons failed:", error);
        }
        // Avoid prototype collisions, such as `icon: "toString"`..
        if (hasOwnProperty(categoryIcons, icon)) {
          component = categoryIcons[icon];
        }
      }
      setIconComponent(() => component);
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
