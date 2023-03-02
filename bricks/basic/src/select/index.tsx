import React, { CSSProperties } from "react";
import { createDecorators, EventEmitter } from "@next-core/element";
import { wrapBrick } from "@next-core/react-element";
import { ReactUseBrick } from "@next-core/react-runtime";
import type { GeneralComplexOption } from "../interface.js";
import styleText from "./index.shadow.css";
import classNames from "classnames";
import "@next-core/theme";
import type { FormItem, FormItemProps } from "../form-item/index.jsx";
import { UseSingleBrickConf, UseBrickConf } from "@next-core/types";
import { formatOptions } from "../formatOptions.js";
import { FormItemElement } from "../form-item/FormItemElement.js";
import { toNumber, isBoolean, isEmpty } from "lodash";

const WrappedFormItem = wrapBrick<FormItem, FormItemProps>(
  "basic.general-form-item"
);

export interface SelectProps {
  curElement: HTMLElement;
  name?: string;
  label?: string;
  options: GeneralComplexOption[];
  placeholder?: string;
  value?: any;
  inputBoxStyle?: React.CSSProperties;
  disabled?: boolean;
  dropdownStyle?: React.CSSProperties;
  onChange?: (value: any) => void;
  optionsChange?: (options: any, name: string) => void;
}

const { defineElement, property, event } = createDecorators();

/**
 * @id basic.general-select
 * @name basic.general-select
 * @docKind brick
 * @description 通用下拉构件
 * @author julielai
 * @noInheritDoc
 */
@defineElement("basic.general-select", {
  styleTexts: [styleText],
})
class Select extends FormItemElement {
  /**
   * @kind string
   * @required true
   * @default -
   * @description 选择框字段名
   * @group basicFormItem
   */
  @property({ attribute: false }) accessor name: string | undefined;

  /**
   * @kind string
   * @required true
   * @default -
   * @description 选择框占位说明
   * @group basic
   */
  @property({ attribute: false }) accessor placeholder: string | undefined;

  /**
   * @kind string
   * @required false
   * @default -
   * @description 选择框字段说明
   * @group basic
   */
  @property() accessor label: string | undefined;

  /**
   * @required true
   * @default -
   * @description 候选项列表
   * @group basic
   */
  @property({ attribute: false })
  accessor options: GeneralComplexOption[] | undefined;

  /**
   * @kind string
   * @required true
   * @default -
   * @description 选择框初始值
   * @group basic
   */
  @property()
  accessor value: any | undefined;

  /**
   * @kind boolean
   * @required false
   * @default -
   * @description 是否必填项
   * @group basicFormItem
   */
  @property({ type: Boolean }) accessor required: boolean | undefined;

  /**
   * @kind Record<string,string>
   * @required false
   * @default -
   * @description 校验文本信息
   * @group basicFormItem
   */
  @property({ attribute: false }) accessor message:
    | Record<string, string>
    | undefined;

  /**
   * @kind boolean
   * @required false
   * @default  false
   * @description 是否禁用
   * @group basic
   */
  @property({ type: Boolean })
  accessor disabled: boolean | undefined;

  /**
   * @kind React.CSSProperties
   * @required false
   * @default -
   * @description 输入框样式
   * @group ui
   */
  @property()
  accessor inputBoxStyle: React.CSSProperties | undefined;

  /**
   * @kind React.CSSProperties
   * @required false
   * @default -
   * @description 下拉框样式
   * @group ui
   */
  @property()
  accessor dropdownStyle: React.CSSProperties | undefined;

  /**
   * @detail `{label: string, value: any, [key: string]: any}	`
   * @description 下拉变化时被触发，`event.detail` 为当前整个选择项包含其他字段值
   */
  @event({ type: "change" }) accessor #changeEvent!: EventEmitter<{
    label: string;
    value: any;
    [key: string]: any;
  }>;

  /**
   * @detail `{options:{label: string, value: any, [key: string]: any},name:string}	`
   * @description 下拉框选项列表变化时被触发
   */
  @event({ type: "optionsChange" }) accessor #optionsChange!: EventEmitter<{
    options: {
      label: string;
      value: any;
      [key: string]: any;
    };
    name: string;
  }>;

  private _handleChange = (value: {
    label: string;
    value: any;
    [key: string]: any;
  }): void => {
    Promise.resolve().then(() => {
      this.#changeEvent.emit(value);
    });
  };

  private _handleOptionsChange = (
    options: {
      label: string;
      value: any;
      [key: string]: any;
    },
    name: string
  ): void => {
    Promise.resolve().then(() => {
      this.#optionsChange.emit({ options, name });
    });
  };

  render() {
    return (
      <SelectComponent
        curElement={this}
        disabled={this.disabled}
        options={formatOptions(this.options)}
        placeholder={this.placeholder}
        value={this.value}
        onChange={this._handleChange}
        optionsChange={this._handleOptionsChange}
        name={this.name}
        label={this.label}
        inputBoxStyle={this.inputBoxStyle}
        dropdownStyle={this.dropdownStyle}
      />
    );
  }
}

export function SelectComponent(props: SelectProps) {
  const {
    options,
    name,
    disabled,
    inputBoxStyle,
    dropdownStyle,
    placeholder,
    optionsChange,
  } = props;
  const [value, setValue] = React.useState<any>();
  const [isDropHidden, setIsDropHidden] = React.useState<boolean>(true);
  const [isFocused, setIsFocused] = React.useState<boolean>(false);
  const selectorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  React.useEffect(() => {
    optionsChange?.(props.options, name as string);
  }, [props.options]);

  const handleChange = (newValue: any): void => {
    setIsDropHidden(true);
    setValue(newValue.label);
    props.onChange?.(newValue);
  };

  return (
    <WrappedFormItem {...props}>
      <div
        className={classNames(
          "select",
          "select-single",
          "select-show-arrow",
          "select-allow-clear",
          { "select-disabled": disabled }
        )}
        style={inputBoxStyle ?? { width: "180px" }}
      >
        <div
          className={classNames("select-selector", {
            "selector-focused": isFocused,
          })}
          ref={selectorRef}
          onMouseDown={() => {
            if (!disabled) {
              setIsDropHidden(!isDropHidden);
              setIsFocused(true);
            }
          }}
          onBlur={() => {
            !isDropHidden ? setIsDropHidden(true) : "";
            setIsFocused(false);
          }}
        >
          <span className="select-selection-search">
            <input
              type="text"
              readOnly={true}
              className="select-selection-search-input"
            ></input>
          </span>
          <span
            style={{ overflow: "hidden", textOverflow: "ellipsis" }}
            className="select-selection-item"
          >
            <div
              className="option"
              style={
                isEmpty(value)
                  ? { color: "var(--antd-input-placeholder-color)" }
                  : {}
              }
            >
              <span className="label">{value ?? placeholder}</span>
            </div>
          </span>
          <span className="select-arrow">
            <span
              className={classNames(
                "anticon",
                "anticon-down ",
                "ant-select-suffix"
              )}
            >
              <svg
                viewBox="64 64 896 896"
                focusable="false"
                data-icon="dhiddenown"
                width="1em"
                height="1em"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"></path>
              </svg>
            </span>
          </span>
        </div>
        <div
          style={{ ...(isDropHidden ? { display: "none" } : {}) }}
          className={classNames(
            "select-dropdown",
            "select-dropdown-placement-bottomLeft"
          )}
        >
          <div className="dropdown-list" style={dropdownStyle}>
            <div>
              <div className="dropdown-inner">
                {options &&
                  options.map((item) => {
                    return (
                      <div
                        key={item.value.toString()}
                        className={classNames(
                          "select-item",
                          "select-item-option",
                          { "select-option-selected": value == item.label }
                        )}
                        onMouseDown={() => handleChange(item)}
                      >
                        <div className="select-item-option-content">
                          <div className="option">
                            <span className="label">{item.label}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </WrappedFormItem>
  );
}
export { Select };
