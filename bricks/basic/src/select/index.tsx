import React, { useCallback, useEffect, useMemo } from "react";
import { createDecorators, EventEmitter } from "@next-core/element";
import { wrapBrick } from "@next-core/react-element";
import type { GeneralComplexOption } from "../interface.js";
import styleText from "./index.shadow.css";
import classNames from "classnames";
import "@next-core/theme";
import type { FormItem, FormItemProps } from "../form-item/index.jsx";
import { formatOptions } from "../formatOptions.js";
import { FormItemElement } from "../form-item/FormItemElement.js";
import type { Form } from "../form/index.js";
import type { Tag, TagProps, TagMapEvents, TagEvents } from "../tag/index.js";
import type {
  GeneralIcon,
  GeneralIconProps,
} from "@next-bricks/icons/general-icon";
import { isEmpty } from "lodash";

const WrappedFormItem = wrapBrick<FormItem, FormItemProps>(
  "basic.general-form-item"
);

const WrappedTag = wrapBrick<Tag, TagProps, TagEvents, TagMapEvents>(
  "basic.general-tag",
  {
    onCheck: "check",
    onClose: "close",
  }
);

const WrappedIcon = wrapBrick<GeneralIcon, GeneralIconProps>(
  "icons.general-icon"
);

export interface SelectProps {
  curElement: HTMLElement;
  formElement: Form;
  trigger?: string;
  value?: any;
  name?: string;
  label?: string;
  options: GeneralComplexOption[];
  placeholder?: string;
  multiple?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  required?: boolean;
  inputStyle?: React.CSSProperties;
  dropdownStyle?: React.CSSProperties;
  validateState?: string;
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
  @property() accessor name: string | undefined;

  /**
   * @kind string
   * @required true
   * @default -
   * @description 选择框占位说明
   * @group basic
   */
  @property() accessor placeholder: string | undefined;

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
  @property({
    attribute: false,
  })
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
   * @kind boolean
   * @required false
   * @default  false
   * @description 是否支持多选
   * @group basic
   */
  @property({ type: Boolean })
  accessor multiple: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default  false
   * @description 是否支持清除
   * @group basic
   */
  @property({ type: Boolean })
  accessor clearable: boolean | undefined;

  /**
   * @kind React.CSSProperties
   * @required false
   * @default -
   * @description 输入框样式
   * @group ui
   */
  @property({
    attribute: false,
  })
  accessor inputStyle: React.CSSProperties | undefined;

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
    value: string | string[];
    options: GeneralComplexOption[];
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

  private _handleChange = (value: string | string[]): void => {
    this.value = value;
    const findOption = (value: any) =>
      (this.options ?? []).find(
        (option) => option.value === value
      ) as GeneralComplexOption;
    const selectedOptions = Array.isArray(value)
      ? value.map((item) => findOption(item))
      : [findOption(value)];

    this.#changeEvent.emit({
      value,
      options: selectedOptions,
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
        formElement={this.getFormElement()}
        name={this.name}
        label={this.label}
        value={this.value}
        disabled={this.disabled}
        placeholder={this.placeholder}
        required={this.required}
        multiple={this.multiple}
        clearable={this.clearable}
        trigger="_handleChange"
        inputStyle={this.inputStyle}
        dropdownStyle={this.dropdownStyle}
        validateState={this.validateState}
        options={formatOptions(this.options)}
        onChange={this._handleChange}
        optionsChange={this._handleOptionsChange}
      />
    );
  }
}

export function SelectComponent(props: SelectProps) {
  const {
    curElement,
    options,
    name,
    disabled,
    multiple,
    clearable,
    inputStyle,
    placeholder,
    validateState,
    optionsChange,
    onChange,
  } = props;
  const [value, setValue] = React.useState<any>(multiple ? [] : undefined);
  const [isDropHidden, setIsDropHidden] = React.useState<boolean>(true);
  const [isFocused, setIsFocused] = React.useState<boolean>(false);

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (isFocused && !curElement.contains(e.target as HTMLElement)) {
        setIsFocused(false);
        setIsDropHidden(true);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  });

  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  useEffect(() => {
    optionsChange?.(props.options, name as string);
  }, [props.options]);

  const handleChange = useCallback(
    (option: GeneralComplexOption): void => {
      let newValue;
      if (multiple) {
        newValue = (value ?? []).includes(option.value)
          ? (value as string[]).filter((item) => item !== option.value)
          : (((value as any[]) ?? []).concat(option.value) as string[]);
      } else {
        newValue = option.value;
      }
      setValue(newValue);
      onChange?.(newValue);
      !multiple && setIsDropHidden(true);
    },
    [multiple, value, onChange]
  );

  const handleMultipleItemClose = useCallback(
    (closeValue: string | number | boolean) => {
      const newValue = (value as string[]).filter(
        (item) => item !== closeValue
      );
      setValue(newValue);
      onChange?.(newValue);
    },
    [onChange, value]
  );

  const handleClear = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setValue(undefined);
    onChange?.(undefined);
  };

  const renderTag = useCallback(
    (list: Array<number | string | boolean>) => {
      const ellipsisInfo =
        list.length - 3 > 0
          ? {
              label: `+${list.length - 3}`,
              key: "$$key",
              value: "",
              closeable: false,
            }
          : null;
      const tagList: Array<GeneralComplexOption | string | number | boolean> =
        list.slice(0, 3);
      ellipsisInfo && tagList.push(ellipsisInfo);
      return tagList.map((item) => {
        let option: GeneralComplexOption;
        if (typeof item === "object") {
          option = item;
        } else {
          option =
            options.find((option) => option.value === item) ??
            ({} as GeneralComplexOption);
          option.closeable = !disabled;
        }
        return (
          <WrappedTag
            key={option.value as number}
            ellipsisWidth="100px"
            color={disabled ? "#ddd" : undefined}
            closable={option.closeable}
            onCheck={() => {
              //
            }}
            onClose={() => handleMultipleItemClose(option.value)}
          >
            {option.label}
          </WrappedTag>
        );
      });
    },
    [handleMultipleItemClose, options, disabled]
  );

  const getLabel = useCallback(
    (value: any) => {
      if (value) {
        return (
          (Array.isArray(value)
            ? renderTag(value)
            : options.find((item) => item.value === value)?.label) ?? ""
        );
      }
      return "";
    },
    [options, renderTag]
  );

  const renderLabel = useMemo(() => {
    return getLabel(value) || (placeholder as string);
  }, [getLabel, placeholder, value]);

  const isEmptyValue = useMemo(() => {
    return typeof value === "object" ? isEmpty(value) : !value;
  }, [value]);

  return (
    <WrappedFormItem {...props}>
      <div
        className={classNames("select", {
          "select-disabled": disabled,
          "select-allow-clear": clearable,
          "select-single": !multiple,
          "select-multiple": multiple,
        })}
        style={inputStyle ?? { width: "180px" }}
      >
        <div
          className={classNames("select-selector", {
            "selector-focused": isFocused,
            "is-error": validateState === "error",
          })}
          onClick={() => {
            if (!disabled) {
              setIsDropHidden(!isDropHidden);
              setIsFocused(!isFocused);
            }
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
                isEmptyValue
                  ? { color: "var(--antd-input-placeholder-color)" }
                  : {}
              }
            >
              <span className="label">{renderLabel}</span>
            </div>
          </span>
          <span className="select-arrow">
            {!isEmptyValue && isFocused && clearable ? (
              <WrappedIcon
                lib="antd"
                icon="close-circle"
                theme="filled"
                onClick={(e) => handleClear(e)}
              />
            ) : (
              <span
                className={classNames(
                  "anticon",
                  "anticon-down ",
                  "ant-select-suffix",
                  {
                    focus: isFocused,
                  }
                )}
              >
                <WrappedIcon icon="down" lib="antd" theme="outlined" />
              </span>
            )}
          </span>
        </div>
        <div
          style={{ ...(isDropHidden ? { display: "none" } : {}) }}
          className="select-dropdown"
        >
          <div className="dropdown-list">
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
                          {
                            "select-option-selected":
                              typeof value !== "object"
                                ? value === item.value
                                : (value as any[]).includes(item.value),
                          }
                        )}
                        onClick={() => handleChange(item)}
                      >
                        <div className="select-item-option-content">
                          <div className="option">
                            <span className="label">{item.label}</span>
                          </div>
                          <div className="is-checked">
                            <WrappedIcon
                              {...{
                                lib: "antd",
                                icon: "check",
                                theme: "outlined",
                              }}
                            />
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
