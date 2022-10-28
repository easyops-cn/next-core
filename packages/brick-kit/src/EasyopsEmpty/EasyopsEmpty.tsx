import React, { useMemo } from "react";
import { Empty } from "antd";
import { getIllustration, IllustrationProps } from "@next-core/illustrations";
import { EmptySvg } from "./EmptySvg";

// @internal
export interface EasyopsEmptyProps {
  background?: string;
  description?: string | React.ReactNode;
  imageStyle?: React.CSSProperties;
  illustration?: IllustrationProps;
  useBigEmptyImage?: boolean;
  noImage?: boolean; //控制不显示图片
}

/**
 * 用于展示空数据的 React 组件。
 */
export function EasyopsEmpty(props: EasyopsEmptyProps): React.ReactElement {
  const illustration = useMemo(
    () => props.illustration && getIllustration(props.illustration),
    [props.illustration]
  );
  const image = props.illustration ? (
    illustration
  ) : (
    <EmptySvg isBig={props.useBigEmptyImage}></EmptySvg>
  );
  const imageStyle =
    props.imageStyle ??
    (props.useBigEmptyImage ? undefined : { height: "60px" });

  return (
    <Empty
      image={props.noImage ? null : image}
      imageStyle={imageStyle}
      description={props.description}
      style={{ color: "var(--text-color-secondary)" }}
    />
  );
}

/**
 * 调用后获得一个默认的展示空数据的 React 组件。
 */
export function renderEasyopsEmpty(): React.ReactNode {
  return <EasyopsEmpty />;
}
