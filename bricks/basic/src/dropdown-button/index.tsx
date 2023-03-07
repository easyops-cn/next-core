import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement, wrapBrick } from "@next-core/react-element";
import styleText from "./dropdown-buttons.shadow.css";
import type { ButtonProps, Button } from "../button/index.jsx";
import type { GeneralIconProps } from "@next-bricks/icons/general-icon";
import { ButtonType, ComponentSize, Shape } from "../interface.js";
import type { Dropdown } from "../dropdown/index.js";
import type { Menu } from "../menu/index.js";
import type { MenuItem } from "../menu-item/index.js";

const { defineElement, property } = createDecorators();

const WrappedButton = wrapBrick<Button, ButtonProps>("basic.general-button");
const WrappedDropdown = wrapBrick<Dropdown, any>("basic.general-dropdown");
const WrappedMenu = wrapBrick<Menu, any>("basic.general-menu");
const WrappedMenuItem = wrapBrick<MenuItem, any>("basic.general-menu-item");
interface DropButtonProps {
  buttons?: DropButtonItemProps[];
  btnText?: string;
  size?: ComponentSize;
  shape?: Shape;
  icon?: GeneralIconProps;
  handleClick: (event: string) => void;
}

type DropButtonItemProps = {
  text: string;
  event?: string;
  icon?: GeneralIconProps;
  disabled?: boolean;
};

const defaultIcon: GeneralIconProps = {
  lib: "antd",
  icon: "setting",
  theme: "filled",
};

/**
 * @id basic.dropdown-button
 * @name basic.dropdown-button
 * @docKind brick
 * @description 下拉按钮
 * @author sailor
 *
 */
@defineElement("basic.dropdown-button", {
  styleTexts: [styleText],
})
class DropdownButton extends ReactNextElement {
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
   * @default
   * @required
   * @description
   */
  @property({
    attribute: false,
  })
  accessor buttons: DropButtonItemProps[] | undefined;

  /**
   * @default 管理
   * @required false
   * @description 按钮默认文字
   */
  @property()
  accessor btnText: string | undefined;

  /**
   * @default { lib: "antd", icon: "setting", theme: "filled" }
   * @required false
   * @description 按钮默认图标
   */
  @property({
    attribute: false,
  })
  accessor icon: GeneralIconProps | undefined;

  /**
   * @default
   * @required
   * @description
   */
  @property()
  accessor size: ComponentSize = "middle";

  /**
   * @kind "circle" | "round"
   * @required false
   * @default -
   * @description 按钮形状，支持圆形、椭圆形，不设置为默认方形
   * @enums "circle"|"round"
   * @group ui
   */
  @property()
  accessor shape: Shape | undefined;

  #handleClick = (eventName: string): void => {
    this.dispatchEvent(new CustomEvent(eventName));
  };

  render() {
    return (
      <DropdownButtonComponent
        buttons={this.buttons}
        btnText={this.btnText}
        size={this.size}
        icon={this.icon}
        shape={this.shape}
        type={this.type}
        handleClick={this.#handleClick}
      />
    );
  }
}

function DropdownButtonComponent({
  buttons,
  btnText = "管理",
  size,
  icon,
  shape,
  type,
  handleClick,
}: DropButtonProps & ButtonProps) {
  return (
    <WrappedDropdown>
      <WrappedButton
        slot="trigger"
        className="dropdown-button"
        size={size}
        shape={shape}
        type={type}
        icon={icon ?? defaultIcon}
      >
        {btnText}
      </WrappedButton>
      {buttons && (
        <WrappedMenu>
          {buttons?.map((button, index) => {
            return (
              <WrappedMenuItem
                key={index}
                {...button}
                onClick={() => {
                  !button.disabled && button.event && handleClick(button.event);
                }}
              >
                {button.text}
              </WrappedMenuItem>
            );
          })}
        </WrappedMenu>
      )}
    </WrappedDropdown>
  );
}

export { DropdownButton };
