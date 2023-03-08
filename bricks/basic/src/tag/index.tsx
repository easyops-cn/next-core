import React, { useMemo, useState } from "react";
import { EventEmitter, createDecorators } from "@next-core/element";
import { ReactNextElement, wrapBrick } from "@next-core/react-element";
import classNames from "classnames";
import type {
  GeneralIcon,
  GeneralIconProps,
} from "@next-bricks/icons/general-icon";
import { ComponentSize } from "../interface.js";
import styleText from "./tag.shadow.css";
import "@next-core/theme";
import { omit } from "lodash";

const { defineElement, property, event } = createDecorators();

const WrappedIcon = wrapBrick<GeneralIcon, GeneralIconProps>(
  "icons.general-icon"
);

const closeIcon: GeneralIconProps = {
  lib: "antd",
  theme: "outlined",
  icon: "close",
};

export enum TagColor {
  blue = "blue",
  "blue-inverse" = "blue-inverse",
  cyan = "cyan",
  "cyan-inverse" = "cyan-inverse",
  geekblue = "geekblue",
  "geekblue-inverse" = "geekblue-inverse",
  gray = "gray",
  "gray-inverse" = "gray-inverse",
  green = "green",
  "green-inverse" = "green-inverse",
  orange = "orange",
  "orange-inverse" = "orange-inverse",
  purple = "purple",
  "purple-inverse" = "purple-inverse",
  red = "red",
  "red-inverse" = "red-inverse",
  yellow = "yellow",
  "yellow-inverse" = "yellow-inverse",
}

export interface TagProps {
  size?: ComponentSize;
  icon?: GeneralIconProps;
  color?: TagColor | string;
  closable?: boolean;
  disabled?: boolean;
  checkable?: boolean;
  checked?: boolean;
  hide?: boolean;
  tagStyle?: React.CSSProperties;
}

export interface TagEvents {
  check?: Event;
  close?: Event;
}

export interface TagMapEvents {
  onCheck: "check";
  onClose: "close";
}

/**
 * @id basic.general-tag
 * @name basic.general-tag
 * @docKind brick
 * @description 标签构件
 * @author sailor
 */
@defineElement("basic.general-tag", {
  styleTexts: [styleText],
})
class Tag extends ReactNextElement implements TagProps {
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
   * @kind TagColor | string
   * @required false
   * @default -
   * @description 颜色
   * @group basic
   */
  @property()
  accessor color: TagColor | string | undefined;

  /**
   * @kind boolean
   * @required false
   * @default -
   * @description 是否禁用
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor disabled: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default -
   * @description 是否允许关闭
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor closable: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default -
   * @description 是否允许选择
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor checkable: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default -
   * @description 是否选择
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor checked: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default -
   * @description 是否隐藏
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor hide: boolean | undefined;

  /**
   * @kind React.CSSProperties
   * @required false
   * @default -
   * @description 标签自定义样式
   * @group basic
   */
  @property({
    attribute: false,
  })
  accessor tagStyle: React.CSSProperties | undefined;

  /**
   * @detail
   * @description 选择事件
   */
  @event({ type: "check" })
  accessor #checkEvent!: EventEmitter<TagProps>;

  handleCheck = (detail: TagProps): void => {
    this.#checkEvent.emit(detail);
  };

  /**
   * @detail
   * @description 关闭事件
   */
  @event({ type: "close" })
  accessor #closeEvent!: EventEmitter<TagProps>;

  handleClose = (detail: TagProps): void => {
    this.#closeEvent.emit(detail);
  };

  render() {
    return (
      <TagComponent
        size={this.size}
        icon={this.icon}
        color={this.color}
        disabled={this.disabled}
        closable={this.closable}
        checkable={this.checkable}
        checked={this.checked}
        tagStyle={this.tagStyle}
        onCheck={this.handleCheck}
        onClose={this.handleClose}
      />
    );
  }
}

export interface TagComponentProps extends TagProps {
  onCheck?: (detail: TagProps) => void;
  onClose?: (detail: TagProps) => void;
}

function TagComponent(props: TagComponentProps) {
  const {
    size = "middle",
    icon,
    hide,
    color,
    disabled,
    closable,
    checkable,
    checked: isChecked,
    tagStyle,
    onCheck,
    onClose,
  } = props;
  const [visible, setVisible] = useState(!hide);
  const [checked, setChecked] = useState(isChecked);

  const useDefineColor = useMemo(() => {
    return Object.values(TagColor).includes(color as TagColor);
  }, [color]);

  const handleCheck = () => {
    if (checkable && !disabled) {
      setChecked(!checked);
      onCheck?.(
        omit(
          {
            ...props,
            checked: !checked,
          },
          ["onCheck", "onClose"]
        )
      );
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(false);
    onClose?.(
      omit(
        {
          ...props,
          hide: false,
        },
        ["onCheck", "onClose"]
      )
    );
  };

  return (
    <div
      className={classNames("tag", size, {
        [`color-${color}`]: useDefineColor,
        hide: !visible,
        checkable,
        checked,
        disabled,
      })}
      style={{
        ...(!useDefineColor && color
          ? {
              background: color,
              color: "#fff",
            }
          : {}),
        ...(tagStyle ?? {}),
      }}
      onClick={handleCheck}
    >
      <div className="tag-wrapper">
        {icon && <WrappedIcon className="tag-icon custom-icon" {...icon} />}
        <slot></slot>
        {closable && !disabled && (
          <WrappedIcon
            className="tag-icon close-icon"
            {...closeIcon}
            onClick={handleClose}
          />
        )}
      </div>
    </div>
  );
}

export { Tag };
