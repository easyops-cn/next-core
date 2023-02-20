import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import type { LinkType, Target } from "../interface.js";
import styleText from "./link.shadow.css";
import classNames from "classnames";
import "@next-core/theme";

export interface LinkProps {
  type?: LinkType;
  disabled?: boolean;
  href?: string;
  target?: Target;
  underline?: boolean;
  linkStyle?: React.CSSProperties;
}

const { defineElement, property } = createDecorators();

/**
 * @id basic.general-link
 * @name basic.general-link
 * @docKind brick
 * @description 通用链接构件
 * @author sailor
 * @noInheritDoc
 */
@defineElement("basic.general-link", {
  styleTexts: [styleText],
})
class Link extends ReactNextElement implements LinkProps {
  /**
   * @kind LinkType
   * @required false
   * @default default
   * @description 链接类型
   * @enums
   * @group basic
   */
  @property() accessor type: LinkType | undefined;

  /**
   * @kind boolean
   * @required false
   * @default false
   * @description 是否禁用
   * @group basic
   */
  @property() accessor disabled: boolean | undefined;

  /**
   * @kind string
   * @required false
   * @default -
   * @description 链接地址
   * @group basic
   */
  @property() accessor href: string | undefined;

  /**
   * @kind Target
   * @required false
   * @default -
   * @description 链接跳转类型
   * @enums
   * @group basic
   */
  @property() accessor target: Target | undefined;

  /**
   * @kind boolean
   * @required false
   * @default false
   * @description 下划线
   * @group basic
   */
  @property() accessor underline: boolean | undefined;

  /**
   * @kind React.CSSProperties
   * @required false
   * @default -
   * @description 链接样式
   * @group other
   */
  @property({ attribute: false }) accessor linkStyle:
    | React.CSSProperties
    | undefined;

  render() {
    return (
      <LinkComponent
        type={this.type}
        disabled={this.disabled}
        href={this.href}
        target={this.target}
        underline={this.underline}
        linkStyle={this.linkStyle}
      />
    );
  }
}

export function LinkComponent({
  type = "link",
  disabled,
  href,
  target,
  underline,
  linkStyle,
}: LinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  };

  return (
    <a
      className={classNames({
        [type]: type,
        disabled: disabled,
        underline: underline,
      })}
      style={linkStyle}
      href={href}
      target={target}
      onClick={handleClick}
    >
      <slot />
    </a>
  );
}

export { Link };
