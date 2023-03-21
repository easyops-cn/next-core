import React, { CSSProperties } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import variablesStyleText from "../data-view-variables.shadow.css";
import styleText from "./modern-style-page-title.shadow.css";

const { defineElement, property } = createDecorators();

interface ModernStylePageTitleProps {
  pageTitle: string;
  description?: string;
  backgroundStyle?: CSSProperties;
  leftRoundStyle?: CSSProperties;
  rightRoundStyle?: CSSProperties;
}

/**
 * @id data-view.modern-style-page-title
 * @name data-view.modern-style-page-title
 * @docKind brick
 * @description 现代风页面标题
 * @author nlicroshan
 * @noInheritDoc
 */
@defineElement("data-view.modern-style-page-title", {
  styleTexts: [variablesStyleText, styleText],
})
class ModernStylePageTitle
  extends ReactNextElement
  implements ModernStylePageTitleProps
{
  /**
   * @kind string
   * @required true
   * @default -
   * @description 页面标题
   */
  @property({
    attribute: false,
  })
  accessor pageTitle: string;

  /**
   * @kind string
   * @required false
   * @default -
   * @description 辅助描述
   */
  @property({
    attribute: false,
  })
  accessor description: string;

  /**
   * @kind CSSProperties
   * @required false
   * @default -
   * @description 背景样式
   */
  @property({
    attribute: false,
  })
  accessor backgroundStyle: CSSProperties;

  /**
   * @kind CSSProperties
   * @required false
   * @default -
   * @description 左边圆形装饰样式
   */
  @property({
    attribute: false,
  })
  accessor leftRoundStyle: CSSProperties;

  /**
   * @kind CSSProperties
   * @required false
   * @default -
   * @description 右边圆形装饰样式
   */
  @property({
    attribute: false,
  })
  accessor rightRoundStyle: CSSProperties;

  render() {
    return (
      <ModernStylePageTitleElement
        pageTitle={this.pageTitle}
        description={this.description}
        backgroundStyle={this.backgroundStyle}
        leftRoundStyle={this.leftRoundStyle}
        rightRoundStyle={this.rightRoundStyle}
      />
    );
  }
}

function ModernStylePageTitleElement(
  props: ModernStylePageTitleProps
): React.ReactElement {
  const {
    pageTitle,
    description,
    backgroundStyle,
    leftRoundStyle,
    rightRoundStyle,
  } = props;

  return (
    <div className="wrapper">
      <div className="background-container" style={backgroundStyle}>
        <div className="left-round" style={leftRoundStyle} />
        <div className="right-round" style={rightRoundStyle} />
      </div>
      <svg
        width="100%"
        height="100%"
        viewBox="0,0,1920,82"
        className="svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="path-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0" />
            <stop offset="38%" stopColor="var(--color-brand)" stopOpacity="1" />
            <stop offset="62%" stopColor="var(--color-brand)" stopOpacity="1" />
            <stop
              offset="100%"
              stopColor="var(--color-brand)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        <path
          d="M0 58 L672 58 C720 58 720 80 768 80 L1152 80 C1200 80 1200 58 1248 58 L1920 58"
          strokeWidth={1.5}
          stroke="url(#path-grad)"
          fill="transparent"
        />
      </svg>
      <div className="text-container">
        <div className="title-text">{pageTitle}</div>
        <div className="description">{description}</div>
      </div>
    </div>
  );
}

export { ModernStylePageTitle };
