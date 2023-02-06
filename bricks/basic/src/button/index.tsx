import React, { useMemo } from "react";
import { createDecorators, type EventEmitter } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import type { ButtonType, ComponentSize } from "../interface.js";
import classNames from "classnames";
import styleText from "./button.shadow.css";
import "../style/index.css";

interface ButtonProps {
  label?: string;
  type?: ButtonType;
  size?: ComponentSize;
  danger?: boolean;
  disabled?: boolean;
  href?: string;
  target?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const { defineElement, property, event } = createDecorators();

@defineElement("basic.general-button", {
  styleTexts: [styleText],
})
class Button extends ReactNextElement {
  /**
   * @kind string
   * @required false
   * @default -
   * @description 按钮名称
   * @group basic
   */
  @property() accessor label: string | undefined;

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
  @property() accessor danger: boolean | undefined;

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
   * @description 链接打开类型
   * @enums
   * @group basic
   */
  @property() accessor target: string | undefined;

  /**
   * @kind any
   * @required false
   * @default {}
   * @description 暂存的数据在事件传出时使用
   * @group advanced
   */
  @property({
    attribute: false,
  })
  accessor dataSource: unknown;

  /**
   * @detail `Record<string, any>`
   * @description 按钮被点击时触发, detail 为 dataSource 数据
   */
  @event({ type: "general.button.click" }) accessor #clickEvent!: EventEmitter<
    React.MouseEvent | unknown
  >;

  #handleClick = (e: React.MouseEvent) => {
    this.#clickEvent.emit(this.dataSource ? this.dataSource : e);
  };

  render() {
    return (
      <ButtonComponent
        label={this.label}
        type={this.type}
        size={this.size}
        danger={this.danger}
        disabled={this.disabled}
        href={this.href}
        target={this.target}
        onClick={this.#handleClick}
      />
    );
  }
}

export function ButtonComponent({
  label,
  type = "default",
  size = "middle",
  danger,
  disabled,
  href,
  target,
  onClick,
}: ButtonProps) {
  const link = useMemo(
    () => (
      <a
        className={classNames(size, {
          danger: danger,
        })}
        href={href}
        target={target}
      >
        {label}
        <slot />
      </a>
    ),
    [danger, size, href]
  );

  const button = useMemo(
    () => (
      <button
        className={classNames(size, {
          [type]: !disabled,
          danger: danger,
        })}
        disabled={disabled}
        onClick={onClick}
      >
        {label}
        <slot />
      </button>
    ),
    [disabled, type, danger, size, label]
  );

  return type === "link" && href ? link : button;
}
