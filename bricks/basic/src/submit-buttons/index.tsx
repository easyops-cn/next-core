import React, { CSSProperties } from "react";
import { createDecorators, EventEmitter } from "@next-core/element";
import { wrapBrick } from "@next-core/react-element";
import styleText from "./index.shadow.css";
// import "@next-core/theme";
import type { FormItem, FormItemProps } from "../form-item/index.js";
import type { Button, ButtonProps } from "../button/index.js";
import type { ButtonType } from "../interface.js";
import { FormItemElement } from "../form-item/FormItemElement.js";

const WrappedFormItem = wrapBrick<FormItem, FormItemProps>(
  "basic.general-form-item"
);
const WrappedButton = wrapBrick<Button, ButtonProps>("basic.general-button");

interface SubmitButtonsProps {
  curElement: HTMLElement;
  submitText?: string;
  submitType?: ButtonType;
  submitDisabled?: boolean;
  cancelText?: string;
  cancelType?: ButtonType;
  onSubmitClick?: (event: React.MouseEvent) => void;
  onCancelClick?: (event: React.MouseEvent) => void;
  showCancelButton?: boolean;
}

const { defineElement, property, event } = createDecorators();

/**
 * @id basic.submit-buttons
 * @name basic.submit-buttons
 * @docKind brick
 * @description 用于general-forms的通用按钮，可以配置submit按钮和cancel按钮
 * @author zhendong
 * @noInheritDoc
 */
@defineElement("basic.submit-buttons", {
  styleTexts: [styleText],
})
class SubmitButtons extends FormItemElement {
  /**
   * @kind string
   * @required false
   * @default -
   * @description 提交按钮的文字，不设置则不显示提交按钮
   * @group basic
   */
  @property() accessor submitText: string | undefined;

  /**
   * @kind boolean
   * @required false
   * @default `false`
   * @description 显示取消按钮
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor showCancelButton: boolean | undefined;

  /**
   * @kind string
   * @required false
   * @default -
   * @description 取消按钮的文字，不设置则不显示取消按钮
   * @group basic
   */
  @property()
  accessor cancelText: string | undefined;

  /**
   * @kind boolean
   * @required false
   * @default `false`
   * @description 点击确定按钮后自动禁用
   * @group advanced
   */
  @property({ type: Boolean })
  accessor disableAfterClick: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default `false`
   * @description 禁用提交按钮
   * @group advanced
   */
  @property({ type: Boolean }) accessor submitDisabled: boolean | undefined;

  /**
   * @kind ButtonType
   * @required false
   * @default default
   * @description 按钮类型
   * @enums
   * @group basic
   */
  @property() accessor submitType: ButtonType | undefined;

  /**
   * @kind ButtonType
   * @required false
   * @default default
   * @description 按钮类型
   * @enums
   * @group basic
   */
  @property() accessor cancelType: ButtonType | undefined;

  /**
   * @description 点击提交按钮触发的事件
   * @detail -
   */
  @event({ type: "submit" }) accessor #submitEvent!: EventEmitter<void>;

  /**
   * @description 点击取消按钮触发的事件
   * @detail -
   */
  @event({ type: "cancel" }) accessor #cancelEvent!: EventEmitter<void>;

  private _handleSubmitClick = (): void => {
    Promise.resolve().then(() => {
      this.#submitEvent.emit();
      if (this.getFormElement()) {
        (this.getFormElement() as any).validate();
      }
      if (this.disableAfterClick) {
        this.submitDisabled = true;
      }
    });
  };

  private _handleCancelClick = (): void => {
    Promise.resolve().then(() => {
      this.#cancelEvent.emit();
    });
  };

  render() {
    return (
      <ButtonsComponent
        curElement={this}
        submitDisabled={this.submitDisabled}
        submitText={this.submitText}
        submitType={this.submitType}
        cancelText={this.cancelText}
        cancelType={this.cancelType}
        onCancelClick={this._handleCancelClick}
        onSubmitClick={this._handleSubmitClick}
        showCancelButton={this.showCancelButton}
      />
    );
  }
}

export function ButtonsComponent(props: SubmitButtonsProps) {
  return (
    <WrappedFormItem {...props}>
      {props.submitText && (
        <WrappedButton
          className={"submitBtn"}
          type={props.submitType || "primary"}
          onClick={props.onSubmitClick}
          disabled={props.submitDisabled}
        >
          {props.submitText}
        </WrappedButton>
      )}
      {props.showCancelButton && props.cancelText && (
        <WrappedButton
          data-test-id="cancelBtn"
          type={props.cancelType || "text"}
          onClick={props.onCancelClick}
        >
          {props.cancelText}
        </WrappedButton>
      )}
    </WrappedFormItem>
  );
}
export { SubmitButtons };
