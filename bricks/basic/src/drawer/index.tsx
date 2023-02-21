import React, { useMemo } from "react";
import { ReactNextElement, wrapBrick } from "@next-core/react-element";
import { createDecorators, type EventEmitter } from "@next-core/element";
import type {
  GeneralIcon,
  GeneralIconProps,
} from "@next-bricks/icons/general-icon";
import type { Placement } from "../interface";
import classNames from "classnames";
import styleText from "./drawer.shadow.css";
import "@next-core/theme";

export interface DrawerEvents {
  close?: Event;
  open?: Event;
}

export interface DrawerMapEvents {
  onClose: "drawer.close";
  onOpen: "drawer.open";
}

interface DrawerProps {
  customTitle?: string;
  width?: number;
  height?: number;
  closeable?: boolean;
  placement?: Placement;
  mask?: boolean;
  maskCloseable?: boolean;
  visible?: boolean;
  footerSlot?: boolean;
}
const { defineElement, property, event, method } = createDecorators();
const WrappedIcon = wrapBrick<GeneralIcon, GeneralIconProps>(
  "icons.general-icon"
);

/**
 * @id basic.general-drawer
 * @name basic.general-drawer
 * @docKind brick
 * @description 通用抽屉构件
 * @author sailor
 * @noInheritDoc
 */
@defineElement("basic.general-drawer", {
  styleTexts: [styleText],
})
class Drawer extends ReactNextElement implements DrawerProps {
  /**
   * @kind string
   * @required false
   * @default default
   * @description 标题
   * @group basic
   */
  @property() accessor customTitle: string | undefined;

  /**
   * @kind number
   * @required false
   * @default default
   * @description 宽度(placement为left，right)
   * @group basic
   */
  @property({
    type: Number,
  })
  accessor width: number | undefined;

  /**
   * @kind number
   * @required false
   * @default default
   * @description 高度(placement为top，bottom)
   * @group basic
   */
  @property({
    type: Number,
  })
  accessor height: number | undefined;

  /**
   * @kind boolean
   * @required false
   * @default default
   * @description 是否显示右上角的关闭按钮
   * @group basic
   */
  @property() accessor closeable: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default default
   * @description 是否展示遮罩层
   * @group basic
   */
  @property() accessor mask: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default default
   * @description 点击遮罩层是否关闭抽屉
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor maskCloseable: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default default
   * @description 遮罩层是否显示
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor visible: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default default
   * @description 是否存在底层插槽
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor footerSlot: boolean | undefined;

  /**
   * @kind Placement
   * @required false
   * @default default
   * @description 抽屉方向
   * @group basic
   */
  @property() accessor placement: Placement | undefined;

  /**
   * @detail
   * @description 抽屉事件
   */
  @event({ type: "open" })
  accessor #drawerOpenEvent!: EventEmitter<void>;

  #handleDrawerOpen = () => {
    this.visible = true;
    this.#drawerOpenEvent.emit();
  };

  /**
   * @detail
   * @description 抽屉事件
   */
  @event({ type: "close" })
  accessor #drawerCloseEvent!: EventEmitter<void>;

  #handleDrawerClose = () => {
    this.visible = false;
    this.#drawerCloseEvent.emit();
  };

  /**
   * @description
   */
  @method()
  open() {
    this.#handleDrawerOpen();
  }

  @method()
  close() {
    this.#handleDrawerClose();
  }

  render() {
    return (
      <DrawerComponent
        customTitle={this.customTitle}
        width={this.width}
        height={this.height}
        closeable={this.closeable}
        visible={this.visible}
        mask={this.mask}
        maskCloseable={this.maskCloseable}
        placement={this.placement}
        footerSlot={this.footerSlot}
        onDrawerClose={this.#handleDrawerClose}
      />
    );
  }
}

interface DrawerComponentProps extends DrawerProps {
  onDrawerClose: () => void;
}

export function DrawerComponent({
  customTitle,
  width = 500,
  height = 378,
  closeable = true,
  mask = true,
  maskCloseable = true,
  placement = "right",
  visible: open = false,
  footerSlot = false,
  onDrawerClose,
}: DrawerComponentProps) {
  const header = useMemo(
    () => (
      <div className="drawer-header">
        <span className="drawer-title">{customTitle}</span>
        <div className="drawer-operator">
          <slot name="extra"></slot>
          {closeable && (
            <WrappedIcon
              className="close-btn"
              lib="antd"
              theme="outlined"
              icon="close"
              onClick={onDrawerClose}
            />
          )}
        </div>
      </div>
    ),
    [closeable, customTitle, onDrawerClose]
  );

  return (
    <div
      className={classNames("drawer", `drawer-${placement}`, {
        open: open,
      })}
    >
      {mask && (
        <div
          className="mask"
          onClick={() => maskCloseable && onDrawerClose()}
        />
      )}
      <div
        className={classNames("drawer-wrapper", `drawer-wrapper-${placement}`)}
        style={{
          width: ["left", "right"].includes(placement) ? width : "",
          height: ["top", "bottom"].includes(placement) ? height : "",
        }}
      >
        <div className="drawer-content">
          {header}
          <div className="drawer-body">
            <slot></slot>
          </div>
          {footerSlot && (
            <div className="drawer-footer">
              <slot name="footer"></slot>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { Drawer };
