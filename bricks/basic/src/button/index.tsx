import React, { useMemo } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement, wrapBrick } from "@next-core/react-element";
import type { ButtonType, ComponentSize, Shape } from "../interface.js";
import type {
  GeneralIcon,
  GeneralIconProps,
} from "@next-bricks/icons/general-icon";
import classNames from "classnames";
import styleText from "./button.shadow.css";
import "@next-core/theme";
export interface ButtonProps {
  type?: ButtonType;
  size?: ComponentSize;
  icon?: GeneralIconProps;
  shape?: Shape;
  danger?: boolean;
  disabled?: boolean;
  href?: string;
  target?: string;
  buttonStyle?: React.CSSProperties;
}

const { defineElement, property } = createDecorators();

const WrappedIcon = wrapBrick<GeneralIcon, GeneralIconProps>(
  "icons.general-icon"
);

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
class Button extends ReactNextElement implements ButtonProps {
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
   * @kind GeneralIconProps
   * @required false
   * @default -
   * @description 图标
   * @group basic
   */
  @property({
    attribute: false,
  })
  accessor icon: GeneralIconProps | undefined;

  /**
   * @kind Shape
   * @required false
   * @default -
   * @description 按钮形状，支持圆形、椭圆形，不设置为默认方形
   * @enums "circle"|"round"
   * @group ui
   */
  @property()
  accessor shape: Shape | undefined;

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
        icon={this.icon}
        shape={this.shape}
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
  icon,
  shape,
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
        {icon && <WrappedIcon className="icon" {...icon} />}
        <slot />
      </a>
    ),
    [size, danger, buttonStyle, href, target, icon]
  );

  const button = useMemo(
    () => (
      <button
        className={classNames(size, shape, {
          [type]: !disabled,
          danger: danger,
        })}
        style={buttonStyle}
        disabled={disabled}
      >
        {icon && <WrappedIcon className="icon" {...icon} />}
        <slot />
      </button>
    ),
    [size, shape, type, disabled, danger, buttonStyle, icon]
  );

  return type === "link" && href ? link : button;
}

export { Button };
