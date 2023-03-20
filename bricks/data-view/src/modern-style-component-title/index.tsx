import React, { CSSProperties, useCallback } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import variablesStyleText from "../data-view-variables.shadow.css";
import styleText from "./modern-style-component-title.shadow.css";

const { defineElement, property } = createDecorators();

interface ModernStyleComponentTitleProps {
  hideLeftComponent?: boolean;
  hideRightComponent?: boolean;
  componentTitle?: string;
  titleTextStyle?: CSSProperties;
  squareColor?: CSSProperties["color"];
}

/**
 * @id data-view.modern-style-component-title
 * @name data-view.modern-style-component-title
 * @docKind brick
 * @description 现代风组件标题
 * @author nlicroshan
 * @noInheritDoc
 */
@defineElement("data-view.modern-style-component-title", {
  styleTexts: [variablesStyleText, styleText],
})
class ModernStyleComponentTitle
  extends ReactNextElement
  implements ModernStyleComponentTitleProps
{
  /**
   * @kind boolean
   * @required false
   * @default false
   * @description 是否隐藏左侧装饰
   */
  @property({
    attribute: false,
  })
  accessor hideLeftComponent = false;

  /**
   * @kind boolean
   * @required false
   * @default true
   * @description 是否隐藏右侧装饰
   */
  @property({
    attribute: false,
  })
  accessor hideRightComponent = true;

  /**
   * @kind string
   * @required false
   * @default -
   * @description 组件标题
   */
  @property({
    attribute: false,
  })
  accessor componentTitle: string;

  /**
   * @kind React.CSSProperties
   * @required false
   * @default -
   * @description 标题文字样式
   */
  @property({
    attribute: false,
  })
  accessor titleTextStyle: CSSProperties;

  /**
   * @kind React.CSSProperties["color"]
   * @required false
   * @default -
   * @description 装饰颜色
   */
  @property({
    attribute: false,
  })
  accessor squareColor: CSSProperties["color"];

  render() {
    return (
      <ModernStyleComponentTitleElement
        hideLeftComponent={this.hideLeftComponent}
        hideRightComponent={this.hideRightComponent}
        componentTitle={this.componentTitle}
        titleTextStyle={this.titleTextStyle}
        squareColor={this.squareColor}
      />
    );
  }
}

function ModernStyleComponentTitleElement(
  props: ModernStyleComponentTitleProps
): React.ReactElement {
  const {
    hideLeftComponent,
    hideRightComponent,
    componentTitle,
    titleTextStyle,
    squareColor,
  } = props;

  const SlashComponent = useCallback(
    ({
      className,
      squareColor,
    }: {
      className: string;
      squareColor: CSSProperties["color"];
    }): React.ReactElement => (
      <div className={className}>
        <div className="slash-component-wrapper">
          <div className="circle" />
          <div className="gray-slash" />
          <div
            className="blue-slash"
            style={{ backgroundColor: squareColor }}
          />
        </div>
      </div>
    ),
    []
  );

  return (
    <div className="wrapper">
      {!hideLeftComponent && (
        <SlashComponent
          className="left-slash-component"
          squareColor={squareColor}
        />
      )}
      {!hideRightComponent && (
        <SlashComponent
          className="right-slash-component"
          squareColor={squareColor}
        />
      )}
      <div
        className="bottom-line"
        style={{
          left: hideLeftComponent ? 0 : 28,
          right: hideRightComponent ? 0 : 28,
          backgroundImage: `linear-gradient(
            90deg,
            ${
              hideLeftComponent
                ? "rgba(255, 255, 255, 0)"
                : "var(--data-view_color-text-divider-line-1)"
            } 0,
            var(--data-view_color-text-divider-line-1) 50%,
            ${
              hideRightComponent
                ? "rgba(255, 255, 255, 0)"
                : "var(--data-view_color-text-divider-line-1)"
            } 100%
            )`,
        }}
      />
      <div
        className="title-wrapper"
        style={{
          justifyContent:
            hideLeftComponent === hideRightComponent
              ? "space-around"
              : "space-between",
        }}
      >
        {hideLeftComponent && (
          <div>
            <slot name="toolbar" />
          </div>
        )}
        <div
          className="title-text-container"
          style={{
            marginLeft: hideLeftComponent || !hideRightComponent ? 0 : 38,
            marginRight: hideRightComponent || !hideLeftComponent ? 0 : 38,
            flexDirection:
              hideRightComponent || !hideLeftComponent ? "row" : "row-reverse",
          }}
        >
          <div className="title-text" style={titleTextStyle}>
            {componentTitle}
          </div>
          <slot name="titleSuffix" />
        </div>
        {hideRightComponent && (
          <div>
            <slot name="toolbar" />
          </div>
        )}
      </div>
    </div>
  );
}

export { ModernStyleComponentTitle };
