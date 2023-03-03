import categories from "./categories";
import { SiteTheme } from "@next-core/brick-types";

export interface IllustrationProps {
  name: string;
  category?: string;
  theme?: SiteTheme;
}

export function determineIllustrationName(
  category: string,
  theme: string,
  name: string
): string {
  const isEasyopsIllustration =
    category === "default" ||
    category === "exception" ||
    category === "feedback" ||
    category === "easyops2";
  return isEasyopsIllustration && theme === "dark-v2" ? `${name}-dark` : name;
}

export function getIllustration(props: IllustrationProps): any {
  const theme = props?.theme || "light";
  const category = props?.category || "default";
  const name = determineIllustrationName(category, theme, props.name);
  const url = (categories as any)?.[category]?.[name];
  return (
    url &&
    `${
      process.env.NODE_ENV === "test" ? "" : __webpack_public_path__
    }assets/illustrations/${url}`
  );
}

export function translateIllustrationConfig(
  useNewIllustration: boolean,
  illustrationsConfig: IllustrationProps
): IllustrationProps {
  const { category, name, theme } = illustrationsConfig;
  const showNewIllustration = useNewIllustration && category === "default";
  const illustrationNames = ["create-content", "browser-version-low"];
  const illustrationCategory = showNewIllustration ? "easyops2" : category;
  const illustrationName =
    showNewIllustration && !illustrationNames.includes(name)
      ? `${name}-dynamic`
      : name;
  return {
    name: illustrationName,
    category: illustrationCategory,
    theme,
  };
}
