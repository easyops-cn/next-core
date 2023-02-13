import React, { useMemo } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement, wrapLocalBrick } from "@next-core/react-element";
import type { ButtonType, ComponentSize } from "../interface.js";
import classNames from "classnames";
import styleText from "./button.shadow.css";
import "@next-core/theme";

interface ButtonProps {
  type?: ButtonType;
  size?: ComponentSize;
  danger?: boolean;
  disabled?: boolean;
  href?: string;
  target?: string;
  buttonStyle?: React.CSSProperties;
}

const { defineElement, property } = createDecorators();

/**
 * @id basic.general-button
 * @name basic.general-button
 * @docKind brick
 * @description 通用按钮构件
 * @author sailor
 * @noInheritDoc
 */
@defineElement("basic.general-button", {
  styleTexts: [styleText],
})
class Button extends ReactNextElement {
  /**
   * @kind ButtonType
   * @required false
   * @default default
   * @description 按钮类型
   * @enums
   * @group basic
   */
  @property() accessor type: ButtonType | undefined;

  /**
   * @kind ComponentSize
   * @required false
   * @default middle
   * @description 按钮大小
   * @enums
   * @group basic
   */
  @property() accessor size: ComponentSize | undefined;

  /**
   * @kind boolean
   * @required false
   * @default false
   * @description 是否开启危险状态
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor danger: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default false
   * @description 是否禁用
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor disabled: boolean | undefined;

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
   * @description 链接类型
   * @enums
   * @group basic
   */
  @property() accessor target: string | undefined;

  /**
   * @kind React.CSSProperties
   * @required false
   * @default -
   * @description 按钮样式
   * @group other
   */
  @property({ attribute: false }) accessor buttonStyle:
    | React.CSSProperties
    | undefined;

  render() {
    return (
      <ButtonComponent
        type={this.type}
        size={this.size}
        danger={this.danger}
        disabled={this.disabled}
        href={this.href}
        target={this.target}
        buttonStyle={this.buttonStyle}
      />
    );
  }
}

export function ButtonComponent({
  type = "default",
  size = "middle",
  danger,
  disabled,
  href,
  target,
  buttonStyle,
}: ButtonProps) {
  const link = useMemo(
    () => (
      <a
        className={classNames(size, {
          danger: danger,
        })}
        style={buttonStyle}
        href={href}
        target={target}
      >
        <slot />
      </a>
    ),
    [size, danger, buttonStyle, href, target]
  );

  const button = useMemo(
    () => (
      <button
        className={classNames(size, {
          [type]: !disabled,
          danger: danger,
        })}
        style={buttonStyle}
        disabled={disabled}
      >
        <slot />
      </button>
    ),
    [size, type, disabled, danger, buttonStyle]
  );

  return type === "link" && href ? link : button;
}

export { Button };

export const WrappedButton = wrapLocalBrick<
  ButtonProps & {
    onClick?: () => void;
  },
  Button
>(Button);
