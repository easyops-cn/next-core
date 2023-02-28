import React, { CSSProperties } from "react";
import { createDecorators, EventEmitter } from "@next-core/element";
import { wrapBrick } from "@next-core/react-element";
import { ReactUseBrick } from "@next-core/react-runtime";
import type {
  RadioType,
  GeneralOption,
  GeneralComplexOption,
  UIType,
  RadioGroupButtonStyle,
} from "../interface.js";
import styleText from "./index.shadow.css";
import classNames from "classnames";
import "@next-core/theme";
import type { FormItem, FormItemProps } from "../form-item/index.jsx";
import { UseSingleBrickConf } from "@next-core/types";
import type {
  GeneralIcon,
  GeneralIconProps,
} from "@next-bricks/icons/general-icon";
import { formatOptions } from "../formatOptions.js";
import { FormItemElement } from "../form-item/FormItemElement.js";
import { toNumber, isBoolean } from "lodash";

const WrappedGeneralIcon = wrapBrick<GeneralIcon, GeneralIconProps>(
  "icons.general-icon"
);

const WrappedFormItem = wrapBrick<FormItem, FormItemProps>(
  "basic.general-form-item"
);

interface CustomOptions {
  url: string;
  description?: string;
  title: string;
  backgroundColor?: string;
  value: string;
  [propName: string]: any;
}

export interface RadioProps {
  type?: RadioType;
  curElement: HTMLElement;
  options: GeneralOption[] | CustomOptions[] | undefined;
  value?: any;
  name?: string;
  disabled?: boolean;
  onChange?: (value: any) => void;
  optionsChange?: (options: any, name: string) => void;
  buttonStyle?: RadioGroupButtonStyle;
  size?: "large" | "middle" | "small";
  ui?: UIType;
  useBrick?: UseSingleBrickConf;
  customStyle?: React.CSSProperties;
  label?: string;
}

declare type SrcIcon = {
  imgSrc?: string;
  imgStyle?: React.CSSProperties;
};

const { defineElement, property, event } = createDecorators();

/**
 * @id basic.general-radio
 * @name basic.general-radio
 * @docKind brick
 * @description 通用单选构件
 * @author sailor
 * @noInheritDoc
 */
@defineElement("basic.general-radio", {
  styleTexts: [styleText],
})
class Radio extends FormItemElement {
  /**
   * @kind string
   * @required true
   * @default -
   * @description 下拉框字段名
   * @group basicFormItem
   */
  @property({ attribute: false }) accessor name: string | undefined;

  /**
   * @kind string
   * @required false
   * @default -
   * @description 单选框字段说明
   * @group basic
   */
  @property() accessor label: string | undefined;

  /**
   * @required true
   * @default -
   * @description 单选框选项表，RadioType为default时，如果设置了tooltip值,可以设置tooltipIcon图标（MenuIcon 类型）,tooltipIcon颜色默认为--color-secondary-text。
   * @group basic
   */
  @property({ attribute: false })
  accessor options: GeneralOption[] | undefined;

  /**
   * @kind string
   * @required true
   * @default -
   * @description 单选框当前选中始值
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
   * @kind RadioType
   * @required false
   * @default default
   * @description 	单选框样式类型
   * @enums "button"|"default"|"icon"|"icon-circle"|"icon-square"|"custom"
   * @group basic
   */
  @property()
  accessor type: RadioType | undefined;

  /**
   * @kind UIType
   * @required false
   * @default default
   * @description Ui样式，可选择 `dashboard` 样式，默认`default`
   * @group ui
   */
  @property()
  accessor ui: UIType | undefined;

  /**
   * @kind "large" | "middle" | "small"
   * @required false
   * @default -
   * @description 大小，只对按钮样式生效
   * @enums "large"|"middle"|"small"
   * @group ui
   */
  @property()
  accessor size: "large" | "middle" | "small" | undefined;

  /**
   * @kind customStyle
   * @required false
   * @default -
   * @description 	自定义radio的外层样式
   * @group ui
   */
  @property({
    attribute: false,
  })
  accessor customStyle: React.CSSProperties | undefined;

  /**
   * @kind `{useBrick: UseSingleBrickConf }`
   * @required false
   * @default
   * @description 自定义radio的内容
   * @group advancedFormItem
   */
  @property({
    attribute: false,
  })
  accessor useBrick: UseSingleBrickConf | undefined;

  /**
   * @detail `{label: string, value: any, [key: string]: any}	`
   * @description 单选框变化时被触发，`event.detail` 为当前整个选择项包含其他字段值
   */
  @event({ type: "change" }) accessor #changeEvent!: EventEmitter<{
    label: string;
    value: any;
    [key: string]: any;
  }>;

  /**
   * @detail `{options:{label: string, value: any, [key: string]: any},name:string}	`
   * @description 单选框选项列表变化时被触发
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
      <RadioComponent
        curElement={this}
        useBrick={this.useBrick}
        ui={this.ui}
        disabled={this.disabled}
        size={this.size}
        options={formatOptions(this.options)}
        type={this.type}
        value={this.value}
        onChange={this._handleChange}
        optionsChange={this._handleOptionsChange}
        name={this.name}
        label={this.label}
      />
    );
  }
}

export function RadioComponent(props: RadioProps) {
  const { options, name, disabled, type, customStyle, optionsChange, size } =
    props;
  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  React.useEffect(() => {
    optionsChange?.(props.options, name as string);
  }, [props.options]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const curIndex = toNumber(e.target.value);
    const _options = options as GeneralComplexOption[];
    const newValueV2 = _options?.find((item, index) => curIndex === index);
    setValue((newValueV2 as GeneralComplexOption)?.value as any);
    props.onChange?.(newValueV2);
  };

  return (
    <WrappedFormItem {...props}>
      <div
        className={classNames("radioGruop", {
          dashboardRadioContainer: props.ui === "dashboard",
        })}
      >
        {options?.map((item: any, index: number) => {
          const icon = item.icon;
          const iconName = icon?.icon;
          const iconLib = icon?.lib;
          const iconStyle: CSSProperties = icon?.iconStyle;
          const key = isBoolean(item.value)
            ? item.value.toString()
            : item.value;
          return (
            <label
              htmlFor={key}
              style={customStyle}
              className={classNames({
                disabledIconRadio:
                  (["icon", "custom", "icon-square", "icon-circle"].includes(
                    type as string
                  ) &&
                    disabled) ||
                  item.disabled,
                disabledCustomRadio:
                  ("custom" === type && disabled) || item.disabled,
                iconRadio: type === "icon",
                customRadio: type === "custom",
                specialIconRadio:
                  type === "icon-circle" || type === "icon-square",
                defaultRadio: ![
                  "button",
                  "icon",
                  "custom",
                  "icon-square",
                  "icon-circle",
                ].includes(type as string),
                buttonRadio: type === "button",
                [size || "middle"]: type === "button",
              })}
              key={key}
            >
              <input
                type="radio"
                value={index} //这里注意一下。
                name={name}
                disabled={disabled || item.disabled}
                id={key}
                onChange={handleChange}
                checked={value === item.value}
              />
              {type === "icon" ? (
                <div className={classNames({ content: true })}>
                  {
                    <WrappedGeneralIcon
                      icon={iconName}
                      lib={iconLib}
                      style={{
                        fontSize: "32px",
                        ...iconStyle,
                      }}
                    />
                  }
                  <div>{item.label}</div>
                </div>
              ) : type === "custom" ? (
                <div className={"customContent"}>
                  {props.useBrick && (
                    <ReactUseBrick
                      useBrick={props.useBrick}
                      data={item}
                    ></ReactUseBrick>
                  )}
                </div>
              ) : type === "icon-circle" || type === "icon-square" ? (
                <div
                  className={classNames({
                    iconContent:
                      type === "icon-circle" || type === "icon-square",
                  })}
                >
                  {item.icon && (
                    <div
                      className={classNames({
                        circleIcon: type === "icon-circle",
                        squareIcon: type === "icon-square",
                      })}
                    >
                      <WrappedGeneralIcon
                        icon={iconName}
                        lib={iconLib}
                        style={{
                          fontSize: "46px",
                          ...iconStyle,
                        }}
                      />
                    </div>
                  )}
                  <span title={item.label}>{item.label}</span>
                </div>
              ) : type === "button" ? (
                <div
                  className={classNames("buttonContent", {
                    buttonRadioCheck: value === item.value,
                    disabledButtonRadio: disabled || item.disabled,
                  })}
                >
                  <span>
                    {
                      <WrappedGeneralIcon
                        icon={iconName}
                        lib={iconLib}
                        style={{
                          fontSize: "22px",
                          marginRight: "8px",
                          verticalAlign: "-0.25em",
                          ...iconStyle,
                        }}
                      />
                    }
                    {item.label}
                  </span>
                </div>
              ) : (
                <span className={classNames({ content: true })}>
                  {
                    <WrappedGeneralIcon
                      icon={iconName}
                      lib={iconLib}
                      style={{
                        fontSize: "22px",
                        marginRight: "8px",
                        verticalAlign: "-0.25em",
                        ...iconStyle,
                      }}
                    />
                  }
                  {item.label}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </WrappedFormItem>
  );
}
export { Radio };
