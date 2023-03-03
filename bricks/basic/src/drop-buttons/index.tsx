import React, { CSSProperties, useEffect, useRef, useState } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement, wrapBrick } from "@next-core/react-element";
import styleText from "./drop-buttons.shadow.css";
import type { ButtonProps, Button } from "../button/index.js";
import { useCallback } from "react";
import classNames from "classnames";
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

interface DropButtonsProps {
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
 * @id basic.drop-buttons
 * @name basic.drop-buttons
 * @docKind brick
 * @description 下拉按钮
 * @author sailor
 *
 */
@defineElement("basic.drop-buttons", {
  styleTexts: [styleText],
})
class DropButton extends ReactNextElement {
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
      <DropButtonComponent
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

function DropButtonComponent({
  curElement,
  buttons,
  btnText = "管理",
  size,
  icon,
  shape,
  handleClick,
}: DropButtonsProps) {
  const dropButtonsRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const handleDocumentClick = useCallback(
    (e: MouseEvent) => {
      if (!curElement.contains(e.target as HTMLElement)) {
        setVisible(visible);
      }
    },
    [visible, curElement]
  );

  useEffect(() => {
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  const renderDropButtonItem = (props: DropButtonItemProps) => {
    const { text, icon, href, event, disabled, target } = props;
    return (
      <div
        className="drop-button-item"
        onClick={(e) => {
          e.stopPropagation();
          disabled ? e.preventDefault() : event && handleClick(event);
          !disabled && setVisible(!visible);
        }}
      >
        {icon && <WrappedIcon className="drop-button-icon" {...icon} />}
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
    <div className="drop-buttons-wrapper" ref={dropButtonsRef}>
      <WrappedButton
        className="drop-button"
        size={size}
        shape={shape}
        icon={icon ?? defaultIcon}
        onClick={() => {
          setVisible(!visible);
        }}
      >
        {btnText}
      </WrappedButton>
      {visible && buttons?.length && (
        <div className="buttons-list">
          <ul>
            {buttons.map((button, index) => {
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
          </ul>
        </div>
      )}
    </div>
  );
}

export { DropButton };
