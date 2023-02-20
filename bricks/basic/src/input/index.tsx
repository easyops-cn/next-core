import React from "react";
import { createDecorators, type EventEmitter } from "@next-core/element";
import { ComponentSize, InputType } from "../interface.js";
import classNames from "classnames";
import { wrapBrick } from "@next-core/react-element";
import "@next-core/theme";
import { FormItemElement } from "../form-item/FormItemElement.js";
import { Form } from "../form/index.js";
import type { FormItem, FormItemProps } from "../form-item/index.jsx";
import styleText from "./input.shadow.css";

const WrappedFormItem = wrapBrick<FormItem, FormItemProps>(
  "basic.general-form-item"
);

interface InputProps {
  formElement?: Form;
  curElement: HTMLElement;
  name?: string;
  label?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  type?: InputType;
  size?: ComponentSize;
  inputStyle?: React.CSSProperties;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  pattern?: string;
  min?: number;
  max?: number;
  validateState?: string;
  trigger?: string;
  onInputChange: (value: string) => void;
}
const { defineElement, property, event } = createDecorators();

/**
 * @id basic.general-input
 * @name basic.general-input
 * @docKind brick
 * @description 通用输入框构件
 * @author sailor
 * @noInheritDoc
 */
@defineElement("basic.general-input", {
  styleTexts: [styleText],
})
class Input extends FormItemElement {
  /**
   * @kind string
   * @required false
   * @default default
   * @description 字段名称
   * @enums
   * @group basic
   */
  @property() accessor name: string | undefined;

  /**
   * @default
   * @required
   * @description
   */
  @property() accessor label: string | undefined;

  /**
   * @kind string
   * @required false
   * @default default
   * @description 初始值
   * @enums
   * @group basic
   */
  @property() accessor value: string | undefined;

  /**
   * @kind string
   * @required false
   * @default middle
   * @description 占位说明
   * @enums
   * @group basic
   */
  @property() accessor placeholder: string | undefined;

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
   * @kind InputType
   * @required false
   * @default false
   * @description 类型
   * @group basic
   */
  @property() accessor type: InputType | undefined;

  /**
   * @kind ComponentSize
   * @required false
   * @default middle
   * @description 大小
   * @enums
   * @group basic
   */
  @property() accessor size: ComponentSize | undefined;

  /**
   * @kind number
   * @required false
   * @default -
   * @description 最小长度
   * @group basicFormItem
   */
  @property({
    type: Number,
  })
  accessor minLength: number | undefined;

  /**
   * @kind number
   * @required false
   * @default -
   * @description 最大长度
   * @group basicFormItem
   */
  @property({
    type: Number,
  })
  accessor maxLength: number | undefined;

  /**
   * @kind boolean
   * @required false
   * @default -
   * @description 表单项是否必填
   * @group basicFormItem
   */
  @property({
    type: Boolean,
  })
  accessor required: boolean | undefined;

  /**
   * @default
   * @required
   * @description
   */
  @property() accessor pattern: string | undefined;

  /**
   * @default
   * @required
   * @description
   */
  @property({
    type: Number,
  })
  accessor max: number | undefined;

  /**
   * @default
   * @required
   * @description
   */
  @property({
    type: Number,
  })
  accessor min: number | undefined;

  /**
   * @default
   * @required
   * @description
   */
  @property({
    attribute: true,
  })
  accessor message: Record<string, string> | undefined;

  /**
   * @kind React.CSSProperties
   * @required false
   * @default -
   * @description 样式
   * @group other
   */
  @property({ attribute: false }) accessor inputStyle:
    | React.CSSProperties
    | undefined;

  /**
   * @detail
   * @description 值改变事件
   */
  @event({ type: "change" })
  accessor #inputChangeEvent!: EventEmitter<string>;

  handleInputChange = (value: string) => {
    this.value = value;
    this.#inputChangeEvent.emit(value);
  };

  render() {
    return (
      <InputComponent
        formElement={this.getFormElement()}
        curElement={this}
        name={this.name}
        label={this.label}
        required={this.required}
        pattern={this.pattern}
        min={this.min}
        max={this.max}
        value={this.value}
        placeholder={this.placeholder}
        type={this.type}
        size={this.size}
        disabled={this.disabled}
        minLength={this.minLength}
        maxLength={this.maxLength}
        inputStyle={this.inputStyle}
        validateState={this.validateState}
        trigger="handleInputChange"
        onInputChange={this.handleInputChange}
      />
    );
  }
}

export function InputComponent(props: InputProps) {
  const {
    name,
    value,
    placeholder,
    type,
    size = "middle",
    disabled,
    inputStyle,
    minLength,
    maxLength,
    validateState,
    onInputChange,
  } = props;

  return (
    <WrappedFormItem {...props}>
      <input
        value={value ?? ""}
        name={name}
        className={classNames(size, {
          error: validateState === "error",
        })}
        type={type}
        disabled={disabled}
        style={inputStyle}
        placeholder={placeholder}
        minLength={minLength}
        maxLength={maxLength}
        onChange={(e) => onInputChange(e.target.value)}
      />
    </WrappedFormItem>
  );
}
