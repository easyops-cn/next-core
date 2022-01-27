import categories from "./categories";
import { SiteTheme } from "@next-core/brick-types";

export interface IllustrationProps {
  name: string;
  category?: string;
  theme?: SiteTheme;
}

export function getIllustration(props: IllustrationProps): any {
  const theme = props?.theme || "light";
  const category = props?.category || "default";
  const name = theme === "dark-v2" ? `${props.name}-dark` : props.name;
  const url = (categories as any)?.[category]?.[name];
  return url && `${window.CORE_ROOT ?? ""}assets/illustrations/${url}`;
}
