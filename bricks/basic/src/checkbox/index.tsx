import React, { HtmlHTMLAttributes, useEffect, useState } from "react";
import { createDecorators, type EventEmitter } from "@next-core/element";
import { wrapBrick } from "@next-core/react-element";
import classNames from "classnames";
import "@next-core/theme";
import styleText from "./checkbox.shadow.css";
import { FormItemElement } from "../form-item/FormItemElement.js";
import type { FormItem, FormItemProps } from "../form-item/index.js";
import type {
  GeneralIcon,
  GeneralIconProps,
} from "@next-bricks/icons/general-icon";

const { defineElement, property, event, method } = createDecorators();

const WrappedFormItem = wrapBrick<FormItem, FormItemProps>(
  "basic.general-form-item"
);
const WrappedIcon = wrapBrick<GeneralIcon, GeneralIconProps>(
  "icons.general-icon"
);

export type CheckboxType = "default" | "icon";

export declare type CheckboxValueType = string | number | boolean;

export interface CheckboxOptionType {
  label: React.ReactNode;
  value: any;
  style?: React.CSSProperties;
  disabled?: boolean;
  checkboxColor?: string;
  [propName: string]: any;
}

export interface MenuIcon {
  [propName: string]: any;
}

export interface OptionGroup {
  /**
   * 分组名称
   */
  name: string;
  /**
   * 分组唯一键，必填，不可重复
   */
  key: string;
  /**
   * 分组下的选项
   */
  options: CheckboxOptionType[];
}

export interface GeneralCheckboxProps {
  options?: CheckboxOptionType[];
  label?: string;
  value?: CheckboxValueType[];
  onChange?: (value: CheckboxValueType[] | CheckboxValueType) => void;
  text?: string;
  type?: CheckboxType;
  isCustom?: boolean;
  name?: string;
  [propName: string]: any;
}

@defineElement("basic.general-checkbox", {
  styleTexts: [styleText],
})
class Checkbox extends FormItemElement {
  /**
   * @kind string
   * @required true
   * @default -
   * @description 多选框当前选中初始值
   * @group basic
   */
  @property({ attribute: false })
  accessor value: string[] | undefined;

  /**
   * @required true
   * @default -
   * @description 多选框选项表
   * @group basic
   */
  @property({ attribute: false })
  accessor options: CheckboxOptionType[] = [];

  /**
   * @kind string
   * @required true
   * @default -
   * @description 多选框字段名
   * @group basicFormItem
   */
  @property({ attribute: false })
  accessor name: string | undefined;

  /**
   * @kind string
   * @required false
   * @default -
   * @description 多选框字段说明
   * @group basic
   */
  @property()
  accessor label: string | undefined;

  /**
   * @kind string
   * @required false
   * @default -
   * @description 多选框类型
   * @group basic
   */
  @property({ attribute: false })
  accessor type: CheckboxType = "default";

  /**
   * @kind boolean
   * @required false
   * @default -
   * @description 多选框字段说明
   * @group basic
   */
  @property({ attribute: false })
  accessor isCustom: boolean = false;

  /**
   * @detail
   * @description 复选框变化事件
   */
  @event({ type: "change" })
  accessor #checkboxChangeEvent!: EventEmitter<void>;

  #handleCheckboxChange = () => {
    this.#checkboxChangeEvent.emit();
  };

  render() {
    return (
      <CheckboxComponent
        options={this.options}
        label={this.label}
        name={this.name}
        value={this.value}
        type={this.type}
        isCustom={this.isCustom}
        onChange={this.#handleCheckboxChange}
      />
    );
  }
}

export { Checkbox };

function CheckboxComponent(props: any) {
  let newValue: CheckboxValueType[] = (props?.value && [...props.value]) || [];
  const [options, setOptions] = useState<CheckboxOptionType[]>(props.options);
  useEffect(() => {
    setOptions(props.options);
  }, [props.options]);

  const handleInputClick = (e: any, item: CheckboxOptionType) => {
    if (e.target.checked) {
      newValue = [...newValue, item.value];
    }
    if (!e.target.checked && newValue?.includes(item.value)) {
      const index = newValue.findIndex((i) => i == item.value);
      newValue.splice(index, 1);
    }
    props.onChange?.(newValue);
  };

  const getIcon = (item: CheckboxOptionType) => {
    let iconNode = null;
    const { icon } = item;
    if (icon) {
      if ("imgSrc" in icon) {
        const mergedIcon: any = {
          ...icon,
          imgSrc: icon.imgSrc,
          imgStyle: {
            marginRight: "8px",
            verticalAlign: "-0.42em",
            ...icon.imgStyle,
          },
        };
        iconNode = icon && (
          <WrappedIcon {...(mergedIcon as GeneralIconProps)} />
        );
      } else {
        iconNode = icon && (
          <WrappedIcon
            {...(icon as GeneralIconProps)}
            style={{
              fontSize: "22px",
              marginRight: "8px",
              verticalAlign: "-0.25em",
            }}
          />
        );
      }
    }
    return iconNode;
  };

  const IconCheckbox = (props: any) => {
    const { name, disabled = false, isCustom = false } = props;
    return (
      <>
        {options.map((item: any) => (
          <label
            htmlFor={item.value}
            key={item.value}
            className={
              disabled || item?.disabled
                ? classNames({
                    disabledIconCheckbox: true,
                    disabledIconCustomCheckbox: isCustom,
                  })
                : classNames({
                    iconCheckbox: true,
                    iconCustomCheckbox: isCustom,
                  })
            }
          >
            <div className={classNames({ inputBox: true })}>
              <input
                type="checkbox"
                value={item.value}
                name={name}
                id={item.value}
                defaultChecked={props?.value?.includes(item.value)}
                disabled={disabled || item?.disabled}
                onChange={(e) => handleInputClick(e, item)}
              />
            </div>
            <div className={classNames({ content: true })}>
              {item.icon && (
                <WrappedIcon
                  {...(item.icon as GeneralIconProps)}
                  style={{
                    fontSize: isCustom ? "52px" : "32px",
                  }}
                ></WrappedIcon>
              )}
              <div className={classNames({ text: true })}>
                {item.label || item.value}
              </div>
            </div>
          </label>
        ))}
      </>
    );
  };

  const CheckboxItem = (props: GeneralCheckboxProps) => {
    return (
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          minHeight: "32px",
        }}
      >
        <div
          className={classNames({
            checkboxWrapper: true,
          })}
        >
          {options?.map((item: CheckboxOptionType) => {
            return (
              <label
                key={item.value}
                className={classNames({
                  checkboxLabel: true,
                  checkboxLabelDisabled: item.disabled,
                })}
              >
                <span
                  style={{ cursor: "not-allowed", color: item.checkboxColor }}
                  className={classNames({
                    checkboxInputWrapper: true,
                    checkboxInputWrapperDisabled: item.disabled,
                    checkboxInputCheck: newValue.includes(item.value),
                  })}
                >
                  <input
                    onClick={(e) => handleInputClick(e, item)}
                    disabled={item.disabled}
                    defaultChecked={props?.value?.includes(item.value)}
                    className={classNames({
                      checkboxInput: true,
                      checkboxInputDisabled: item.disabled,
                    })}
                    type="checkbox"
                    id={item.value}
                  ></input>
                  <span className={classNames({ checkboxInner: true })}></span>
                </span>

                <span className={classNames({ checkboxText: true })}>
                  <slot>
                    {getIcon(item)}
                    {item.label}
                  </slot>
                </span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <WrappedFormItem {...props}>
      {props.type == "icon" ? (
        <IconCheckbox {...props}></IconCheckbox>
      ) : (
        <CheckboxItem {...props}></CheckboxItem>
      )}
    </WrappedFormItem>
  );
}
