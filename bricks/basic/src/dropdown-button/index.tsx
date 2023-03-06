import React, { useEffect, useRef, useState, useCallback } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement, wrapBrick } from "@next-core/react-element";
import styleText from "./dropdown-buttons.shadow.css";
import classNames from "classnames";
import type { ButtonProps, Button } from "../button/index.jsx";
import type {
  GeneralIcon,
  GeneralIconProps,
} from "@next-bricks/icons/general-icon";
import { ComponentSize, Shape } from "../interface.js";

const { defineElement, property } = createDecorators();

const WrappedButton = wrapBrick<Button, ButtonProps>("basic.general-button");
const WrappedIcon = wrapBrick<GeneralIcon, GeneralIconProps>(
  "icons.general-icon"
);

interface DropButtonProps {
  curElement: HTMLElement;
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
} & ButtonProps;

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
        curElement={this}
        buttons={this.buttons}
        btnText={this.btnText}
        size={this.size}
        icon={this.icon}
        shape={this.shape}
        handleClick={this.#handleClick}
      />
    );
  }
}

function DropdownButtonComponent({
  curElement,
  buttons,
  btnText = "管理",
  size,
  icon,
  shape,
  handleClick,
}: DropButtonProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const handleDocumentClick = useCallback(
    (e: MouseEvent) => {
      if (e.target === curElement) return;
      if (
        !curElement.contains(e.target as HTMLElement) ||
        !wrapperRef.current?.contains(e.target as HTMLElement)
      ) {
        setVisible(false);
      }
    },
    [curElement]
  );

  useEffect(() => {
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [handleDocumentClick]);

  const renderDropButtonItem = (props: DropButtonItemProps) => {
    const { text, icon, href, event, disabled, target } = props;
    return (
      <div
        className="dropdown-button-item"
        onClick={(e) => {
          e.stopPropagation();
          disabled ? e.preventDefault() : event && handleClick(event);
          !disabled && setVisible(false);
        }}
      >
        {icon && <WrappedIcon className="dropdown-button-icon" {...icon} />}
        {href ? (
          <a href={href} target={target}>
            {text}
          </a>
        ) : (
          text
        )}
      </div>
    );
  };

  return (
    <div className="dropdown-button-wrapper" ref={wrapperRef}>
      <WrappedButton
        className="dropdown-button"
        size={size}
        shape={shape}
        icon={icon ?? defaultIcon}
        onClick={() => {
          setVisible(!visible);
        }}
      >
        {btnText}
      </WrappedButton>
      {visible && (
        <div className="buttons-list">
          <ul>
            {buttons?.map((button, index) => {
              return (
                <li
                  className={classNames({
                    disabled: button.disabled,
                  })}
                  key={index}
                >
                  {renderDropButtonItem(button)}
                </li>
              );
            })}
            <slot></slot>
          </ul>
        </div>
      )}
    </div>
  );
}

export { DropdownButton };
