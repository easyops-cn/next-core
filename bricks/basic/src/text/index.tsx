import React, { CSSProperties } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import styleText from "../button/button.shadow.css";

export interface TextProps {
  color?: CSSProperties["color"];
  fontSize?: CSSProperties["fontSize"];
  fontWeight?: CSSProperties["fontWeight"];
  textAlign?: CSSProperties["textAlign"];
  lineHeight?: CSSProperties["lineHeight"];
  display?: CSSProperties["display"];
  customStyle?: CSSProperties | undefined;
}
const { defineElement, property } = createDecorators();
/**
 * @id basic.general-text
 * @name basic.general-text
 * @docKind brick
 * @description 通用文本构件
 * @author astrid
 * @noInheritDoc
 */
@defineElement("basic.general-text", {
  styleTexts: [styleText],
})
class Text extends ReactNextElement implements TextProps {
  /**
   * @default 14px
   * @required false
   * @description 字体大小
   * @group basic
   */
  @property({ type: String })
  accessor fontSize: CSSProperties["fontSize"];

  /**
   * @default normal
   * @required false
   * @description 字体粗细
   * @group basic
   */
  @property({ type: String })
  accessor fontWeight: CSSProperties["fontWeight"];

  /**
   * @default black
   * @required false
   * @description 字体颜色
   * @group basic
   */
  @property({ type: String })
  accessor color: CSSProperties["color"];

  /**
   * @default 14px
   * @required false
   * @description 字体行高
   * @group basic
   */
  @property({ type: String })
  accessor lineHeight: CSSProperties["lineHeight"];

  /**
   * @default left
   * @required false
   * @description 字体对齐方式
   * @group basic
   */
  @property({ type: String })
  accessor textAlign: CSSProperties["textAlign"];

  /**
   * @default inline
   * @required false
   * @description 显示类型, 在文字构件中常用inline inline-block block,其余类型请查看[相关文档](https://developer.mozilla.org/zh-CN/docs/Web/CSS/display)
   * @group basic
   */
  @property({ type: String })
  accessor display: CSSProperties["display"];

  /**
   * @kind React.CSSProperties
   * @default 使用自定义样式,将会覆盖默认样式
   * @required false
   * @description 自定义样式
   * @group ui
   */
  @property({ attribute: false }) accessor customStyle:
    | CSSProperties
    | undefined;

  render() {
    return (
      <TextComponent
        color={this.color}
        fontSize={this.fontSize}
        fontWeight={this.fontWeight}
        lineHeight={this.lineHeight}
        display={this.display}
        textAlign={this.textAlign}
        customStyle={this.customStyle}
      />
    );
  }
}
export function TextComponent(props: TextProps): React.ReactElement {
  return (
    <span
      style={
        {
          color: props.color,
          fontSize: props.fontSize,
          fontWeight: props.fontWeight,
          lineHeight: props.lineHeight,
          display: props.display,
          textAlign: props.textAlign,
          ...props.customStyle,
        } as React.CSSProperties
      }
    >
      <slot />
    </span>
  );
}
export { Text };
