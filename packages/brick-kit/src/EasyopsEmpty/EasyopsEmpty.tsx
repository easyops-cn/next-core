import React from "react";
import { Empty } from "antd";
import EmptyGreyImage from "./empty-grey-image.svg";
import EmptyLightGreyImage from "./empty-light-grey-image.svg";

interface EasyopsEmptyProps {
  background?: string;
  description?: string | React.ReactNode;
  imageStyle?: React.CSSProperties;
}

/**
 * 用于展示空数据的 React 组件。
 */
export const EasyopsEmpty = (props: EasyopsEmptyProps): React.ReactElement => {
  const background = props.background ?? "white";
  const emptyImage =
    background === "white" ? EmptyGreyImage : EmptyLightGreyImage;
  const image = React.createElement(emptyImage);
  return (
    <Empty
      image={image}
      imageStyle={props.imageStyle}
      description={props.description}
    />
  );
};

/**
 * 调用后获得一个默认的展示空数据的 React 组件。
 */
export const renderEasyopsEmpty = (): React.ReactNode => {
  return <EasyopsEmpty />;
};
