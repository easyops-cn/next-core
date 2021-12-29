import React, { useMemo } from "react";
import { Empty } from "antd";
import { getIllustration, IllustrationProps } from "@next-core/illustrations";

import emptyImage from "../images/empty-image.png";
import bigEmptyImage from "../images/big-empty-image.png";

// @internal
export interface EasyopsEmptyProps {
  background?: string;
  description?: string | React.ReactNode;
  imageStyle?: React.CSSProperties;
  illustration?: IllustrationProps;
  useBigEmptyImage?: boolean;
}

/**
 * 用于展示空数据的 React 组件。
 */
export function EasyopsEmpty(props: EasyopsEmptyProps): React.ReactElement {
  const illustration = useMemo(
    () => props.illustration && getIllustration(props.illustration),
    [props.illustration]
  );
  const _emptyImage = props.useBigEmptyImage ? bigEmptyImage : emptyImage;
  const image = props.illustration ? illustration : getImageUrl(_emptyImage);
  const imageStyle =
    props.imageStyle ??
    (props.useBigEmptyImage ? undefined : { height: "60px" });

  return (
    <Empty
      image={image}
      imageStyle={imageStyle}
      description={props.description}
    />
  );
}

function getImageUrl(url: string): string {
  return `${window.CORE_ROOT ?? ""}assets/${url}`;
}

/**
 * 调用后获得一个默认的展示空数据的 React 组件。
 */
export function renderEasyopsEmpty(): React.ReactNode {
  return <EasyopsEmpty />;
}
