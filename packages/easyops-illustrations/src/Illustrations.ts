import categories from "./categories";

export interface IllustrationProps {
  name: string;
  category?: string;
}

export function getIllustration(props: IllustrationProps): any {
  const category = props?.category || "default";
  return (categories as any)?.[category]?.[props.name];
}
