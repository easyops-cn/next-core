import React, { useState } from "react";
import { createDecorators, type EventEmitter } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import { ComponentSize, InputType } from "../interface.js";
import classNames from "classnames";
import styleText from "./input.shadow.css";
import "@next-core/theme";

interface InputProps {
  name?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  type?: InputType;
  size?: ComponentSize;
  inputStyle?: React.CSSProperties;
  minLength?: number;
  maxLength?: number;
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
class Input extends ReactNextElement {
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
  accessor #InputChangeEvent: EventEmitter<string>;

  #handleInputChange = (value: string) => {
    this.#InputChangeEvent.emit(value);
  };

  render() {
    return (
      <InputComponent
        name={this.name}
        value={this.value}
        placeholder={this.placeholder}
        type={this.type}
        size={this.size}
        disabled={this.disabled}
        minLength={this.minLength}
        maxLength={this.maxLength}
        inputStyle={this.inputStyle}
        onInputChange={this.#handleInputChange}
      />
    );
  }
}

export function InputComponent({
  name,
  value,
  placeholder,
  type,
  size = "middle",
  disabled,
  inputStyle,
  minLength,
  maxLength,
  onInputChange,
}: InputProps) {
  const [inputValue, setInputValue] = useState(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setInputValue(value);
    onInputChange(value);
  };

  return (
    <input
      name={name}
      className={classNames(size)}
      type={type}
      value={inputValue}
      disabled={disabled}
      style={inputStyle}
      placeholder={placeholder}
      minLength={minLength}
      maxLength={maxLength}
      onChange={handleInputChange}
    />
  );
}
