import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { createDecorators, type EventEmitter } from "@next-core/element";
import { ReactNextElement, wrapBrick } from "@next-core/react-element";
import classNames from "classnames";
import type { Button, ButtonProps } from "../button";
import type {
  GeneralIcon,
  GeneralIconProps,
} from "@next-bricks/icons/general-icon";
import styleText from "./modal.shadow.css";
import "@next-core/theme";

/**
 * Wrap usage:
 *
 * ```ts
 * import type { Modal, ModalProps, ModalEvents, ModalMapEvents } from "@next-bricks/basic/modal";
 *
 * const WrappedModal = wrapBrick<Modal, ModalProps, ModalEvents, ModalMapEvents>("basic.general-modal", {
 *   onClose: "close",
 *   onConfirm: "confirm",
 *   onCancel: "cancel",
 * });
 *
 * <WrappedModal
 *  modalTitle="..."
 *  onClose={() => { ... }}
 * />
 * ```
 */

export interface ModalProps {
  modalTitle?: string;
  width?: string | number;
  maskClosable?: boolean;
  confirmText?: string;
  cancelText?: string;
  fullscreen?: boolean;
  confirmDisabled?: boolean;
  visible?: boolean;
}

export interface ModalEvents {
  close?: Event;
  confirm?: Event;
  cancel?: Event;
}

export interface ModalMapEvents {
  onClose: "close";
  onConfirm: "confirm";
  onCancel: "cancel";
}

// 使用弱关联来引用其他构件，以便按需加载构件，并避免打包可能包含重复文件的问题。
const WrappedButton = wrapBrick<Button, ButtonProps>("basic.general-button");
const WrappedIcon = wrapBrick<GeneralIcon, GeneralIconProps>(
  "icons.general-icon"
);

const { defineElement, property, event, method } = createDecorators();

@defineElement("basic.general-modal", {
  styleTexts: [styleText],
})
class Modal extends ReactNextElement implements ModalProps {
  /**
   * @kind string
   * @required false
   * @default -
   * @description 标题
   * @group basic
   */
  @property() accessor modalTitle: string | undefined;

  /**
   * @kind string
   * @required false
   * @default -
   * @description 宽度
   * @group basic
   */
  @property() accessor width: string | number | undefined;

  /**
   * @kind boolean
   * @required false
   * @default -
   * @description 点击遮罩层是否关闭模态框
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor maskClosable: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default -
   * @description 全屏模式
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor fullscreen: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default -
   * @description 点击确定按钮时自动关闭弹窗
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor autoCloseWhenConfirm: boolean | undefined = true;

  /**
   * @kind boolean
   * @required false
   * @default -
   * @description 确认按钮是否禁用
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor confirmDisabled: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default -
   * @description 点击遮罩层是否关闭模态框
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor visible: boolean | undefined;

  /**
   * @detail
   * @description 打开弹窗事件
   */
  @event({ type: "open" }) accessor #modalOpen!: EventEmitter<void>;
  #handleModelOpen() {
    this.#modalOpen.emit();
  }

  /**
   * @detail
   * @description 关闭弹窗事件
   */
  @event({ type: "close" })
  accessor #modalClose!: EventEmitter<void>;
  #handleModelClose() {
    this.#modalClose.emit();
  }

  /**
   * @detail
   * @description 确认按钮事件
   */
  @event({ type: "confirm" })
  accessor #modalConfirm!: EventEmitter<void>;
  #handleModelConfirm = () => {
    if (this.confirmDisabled) return;
    this.#modalConfirm.emit();
    if (this.autoCloseWhenConfirm) {
      this.close();
    }
  };

  /**
   * @detail
   * @description 取消按钮事件
   */
  @event({ type: "cancel" })
  accessor #modalCancel!: EventEmitter<void>;
  #handleModelCancel = () => {
    this.#modalCancel.emit();
    this.close();
  };

  /**
   * @description 打开模态款
   */
  @method()
  open() {
    this.visible = true;
    this.#handleModelOpen();
  }

  /**
   * @description 关闭弹窗
   */
  @method({ bound: true })
  close() {
    this.visible = false;
    this.#handleModelClose();
  }

  render() {
    return (
      <ModalComponent
        modalTitle={this.modalTitle}
        width={this.width}
        maskClosable={this.maskClosable}
        visible={this.visible}
        fullscreen={this.fullscreen}
        confirmDisabled={this.confirmDisabled}
        onModalClose={() => (this.visible = false)}
        onModalConfirm={this.#handleModelConfirm}
        onModalCancel={this.#handleModelCancel}
      />
    );
  }
}

export { Modal };

interface ModalComponentProps extends ModalProps {
  onModalClose: () => void;
  onModalConfirm: () => void;
  onModalCancel: () => void;
}

function ModalComponent({
  modalTitle,
  width,
  maskClosable,
  confirmText = "确定",
  cancelText = "取消",
  visible: open = false,
  fullscreen,
  confirmDisabled,
  onModalConfirm,
  onModalCancel,
  onModalClose,
}: ModalComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState<boolean>(open);

  const handleWrapperClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      if (maskClosable) {
        if (!containerRef.current?.contains(e.target as Element)) {
          onModalClose();
        }
      }
    },
    [maskClosable, onModalClose]
  );

  const handleConfirmClick = useCallback(() => {
    onModalConfirm();
  }, [onModalConfirm]);

  const handleCancelClick = useCallback(() => {
    onModalCancel();
  }, [onModalCancel]);

  const header = useMemo(
    () => (
      <div className="modal-header">
        <span className="modal-title">{modalTitle}</span>
        <WrappedIcon
          className="close-btn"
          lib="antd"
          theme="outlined"
          icon="close"
          onClick={onModalClose}
        />
      </div>
    ),
    [modalTitle, onModalClose]
  );

  const body = useMemo(
    () => (
      <div
        className={classNames("modal-body", {
          fullscreen,
        })}
      >
        <slot></slot>
      </div>
    ),
    [fullscreen]
  );

  const footer = useMemo(
    () => (
      <div className="modal-footer">
        <WrappedButton type="text" onClick={handleCancelClick}>
          {cancelText}
        </WrappedButton>
        <WrappedButton
          type="primary"
          disabled={confirmDisabled}
          onClick={handleConfirmClick}
        >
          {confirmText}
        </WrappedButton>
      </div>
    ),
    [
      cancelText,
      confirmText,
      confirmDisabled,
      handleCancelClick,
      handleConfirmClick,
    ]
  );

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  return isOpen ? (
    <div className="modal">
      <div className="mask" />
      <div className="modal-wrap" onClick={handleWrapperClick}>
        <div
          className={classNames("modal-container", {
            fullscreen,
          })}
          style={{
            width: width,
          }}
          ref={containerRef}
        >
          {header}
          {body}
          {footer}
        </div>
      </div>
    </div>
  ) : null;
}
