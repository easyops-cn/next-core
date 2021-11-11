import categories from "./categories";

export interface IllustrationProps {
  name: string;
  category?: string;
}

export function getIllustration(props: IllustrationProps): any {
  const category = props?.category || "default";
  const url = (categories as any)?.[category]?.[props.name];
  return url && `${window.CORE_ROOT ?? ""}assets/illustrations/${url}`;
}
