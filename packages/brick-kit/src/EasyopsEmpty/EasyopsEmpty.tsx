import React, { useMemo } from "react";
import { Empty } from "antd";
import EmptyGreyImage from "./empty-grey-image.svg";
import EmptyLightGreyImage from "./empty-light-grey-image.svg";
import { getIllustration, IllustrationProps } from "@easyops/illustrations";
// @internal
export interface EasyopsEmptyProps {
  background?: string;
  description?: string | React.ReactNode;
  imageStyle?: React.CSSProperties;
  illustration?: IllustrationProps;
}
/**
 * 用于展示空数据的 React 组件。
 */
export function EasyopsEmpty(props: EasyopsEmptyProps): React.ReactElement {
  const background = props.background ?? "white";
  const emptyImage =
    background === "white" ? EmptyGreyImage : EmptyLightGreyImage;

  const illustration = useMemo(
    () => props.illustration && getIllustration(props.illustration),
    [props.illustration]
  );

  const image = props.illustration
    ? illustration
    : React.createElement(emptyImage);
  return (
    <Empty
      image={image}
      imageStyle={props.imageStyle}
      description={props.description}
    />
  );
}

/**
 * 调用后获得一个默认的展示空数据的 React 组件。
 */
export function renderEasyopsEmpty(): React.ReactNode {
  return <EasyopsEmpty />;
}
