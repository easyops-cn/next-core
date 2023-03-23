import React from "react";
import { createDecorators, EventEmitter } from "@next-core/element";
import { FormItemElement } from "./FormItemElement.js";
import type { GeneralFormElement } from "../form/index.js";
import { Form } from "antd-mobile";
import { isBoolean } from "lodash";

type NamePath = string | number | (string | number)[];
interface RuleConfig {
  /**仅在 type 为 array 类型时有效，用于指定数组元素的校验规则 */
  defaultField: any;
  /**是否匹配枚举中的值（需要将 type 设置为 enum) */
  enum: any[];
  /**string 类型时为字符串长度；number 类型时为确定数字； array 类型时为数组长度 */
  len: number;
  /**必须设置 type：string 类型为字符串最大长度；number 类型时为最大值；array 类型时为数组最大长度 */
  max: number;
  /**错误信息，不设置时会通过模板自动生成 */
  message: string;
  /**必须设置 type：string 类型为字符串最小长度；number 类型时为最小值；array 类型时为数组最小长度 */
  min: number;
  /**正则表达式匹配 */
  pattern: RegExp;
  /**是否为必选字段 */
  required: boolean;
  /**将字段值转换成目标值后进行校验 */
  transform: (value) => any;
  /**类型，常见有 string |number |boolean |url | email。 */
  type: string;
  /**设置触发验证时机，必须是 Form.Item 的 validateTrigger 的子集 */
  validateTrigger: string | string[];
  /**自定义校验，接收 Promise 作为返回值。 */
  validator: (rule, value) => Promise<any>;
  /**仅警告，不阻塞表单提交 */
  warningOnly: boolean;
  /**如果字段仅包含空格则校验不通过，只在 type: 'string' 时生效 */
  whitespace: boolean;
}
type Rule = RuleConfig | ((form) => RuleConfig);
export interface FormItemProps {
  formElement?: GeneralFormElement;
  curElement?: HTMLElement;
  disabled?: boolean;
  hidden?: boolean;
  hasFeedback?: boolean;
  name?: NamePath;
  label?: React.ReactNode;
  current?: HTMLElement;
  required?: boolean;
  rules?: Rule[];
  noStyle?: boolean;
  arrow?: boolean;
  help?: React.ReactNode;
  layout?: "vertical" | "horizontal";
  onClick?: (
    e: React.MouseEvent,
    widgetRef: React.MutableRefObject<any>
  ) => void;
  preserve?: boolean;
  trigger?: string;
  validateTrigger?: string | string[];
  valuePropName?: string;
}

const { defineElement, property, event, method } = createDecorators();

/**
 * @id itsc-mobile.general-form-item
 * @name itsc-mobile.general-form-item
 * @docKind brick
 * @description 通用表单项
 * @author garen
 * @noInheritDoc
 */
@defineElement("itsc-mobile.general-form-item", {
  styleTexts: [],
})
class FormItem extends FormItemElement implements FormItemProps {
  /**
   * @default
   * @required
   * @description
   */
  @property({
    attribute: false,
  })
  accessor formElement: GeneralFormElement | undefined;

  /**
   * @default
   * @required
   * @description
   */
  @property({
    attribute: false,
  })
  accessor curElement!: HTMLElement;

  /**
   * @kind boolean
   * @required false
   * @default - 父级 Form 的 disabled
   * @description 是否禁用
   * @group itsc-mobile
   */
  @property({ type: Boolean }) accessor disabled: boolean;

  /**
   * @kind boolean
   * @required false
   * @default - false
   * @description 是否隐藏整个字段
   * @group itsc-mobile
   */
  @property({ type: Boolean }) accessor hidden: boolean = false;

  /**
   * @kind boolean
   * @required false
   * @default - true
   * @description 是否展示错误反馈
   * @group itsc-mobile
   */
  @property({ type: Boolean }) accessor hasFeedback: boolean = true;

  /**
   * @kind 'vertical' | 'horizontal'
   * @required false
   * @default - 父级 Form 的 layout
   * @description 布局模式
   * @group itsc-mobile
   */
  @property() accessor layout: "vertical" | "horizontal";

  /**
   * @kind boolean
   * @required false
   * @default - false
   * @description 不使用样式，只使用字段管理
   * @group itsc-mobile
   */
  @property({ type: Boolean }) accessor noStyle: boolean = false;

  /**
   * @kind boolean
   * @required false
   * @default - false
   * @description 不使用样式，只使用字段管理
   * @group itsc-mobile
   */
  @property({ type: Boolean }) accessor arrow: boolean = false;

  /**
   * @kind React.ReactNode
   * @required false
   * @default -
   * @description 提示文本
   * @group itsc-mobile
   */
  @property({ attribute: false }) accessor help: React.ReactNode;

  /**
   * @kind React.ReactNode
   * @required false
   * @default -
   * @description 标签名
   * @group itsc-mobile
   */
  @property() accessor label: React.ReactNode;

  /**
   * @kind NamePath
   * @required false
   * @default -
   * @description 字段名，支持数组
   * @group itsc-mobile
   */
  @property() accessor name: NamePath;

  /**
   * @kind boolean
   * @required false
   * @default - true
   * @description 当字段被删除时保留字段值
   * @group itsc-mobile
   */
  @property({ type: Boolean }) accessor preserve: boolean = true;

  /**
   * @kind boolean
   * @required false
   * @default - false
   * @description 是否必选，需要注意的是这个属性仅仅用来控制外观，并不包含校验逻辑
   * @group itsc-mobile
   */
  @property({ type: Boolean }) accessor required: boolean = false;

  /**
   * @kind Rule[]
   * @required false
   * @default -
   * @description 校验规则，设置字段的校验逻辑
   * @group itsc-mobile
   */
  @property({ attribute: false }) accessor rules: Rule[];

  /**
   * @kind string
   * @required false
   * @default - "value"
   * @description 子节点的值的属性，如 Switch 的是 'checked'。
   * @group itsc-mobile
   */
  @property() accessor valuePropName: string = "value";

  /**
   * @kind string | string[]
   * @required false
   * @default - "onChange"
   * @description 设置字段校验的时机
   * @group itsc-mobile
   */
  @property() accessor validateTrigger: string | string[] = "onChange";

  /**
   * @kind string
   * @required false
   * @default - "onChange"
   * @description 设置收集字段值变更的时机
   * @group itsc-mobile
   */
  @property() accessor trigger: string = "onChange";

  /**
   * @description 点击事件并收集子组件 Ref
   */
  @event({ type: "collect.ref" }) accessor #collectRefEvent!: EventEmitter<
    Record<string, unknown>
  >;

  /**
   * @description
   */
  @method()
  onClick(e: React.MouseEvent, widgetRef: React.MutableRefObject<any>) {
    this.#collectRefEvent.emit({ e, widgetRef });
  }

  render() {
    const formElement = this.getFormElement();
    return (
      <FormItemComponent
        formElement={formElement}
        curElement={this}
        disabled={
          isBoolean(this.disabled) ? this.disabled : formElement?.disabled
        }
        hidden={this.hidden}
        hasFeedback={this.hasFeedback}
        layout={this.layout || formElement?.layout}
        noStyle={this.noStyle}
        help={this.help}
        arrow={this.arrow}
        label={this.label}
        name={this.name}
        onClick={this.onClick}
        preserve={this.preserve}
        required={this.required}
        rules={this.rules}
        trigger={this.trigger}
        validateTrigger={this.validateTrigger}
        valuePropName={this.valuePropName}
      />
    );
  }
}

export { FormItem };

export function FormItemComponent(props: FormItemProps) {
  return (
    <Form.Item {...props}>
      <slot></slot>
    </Form.Item>
  );
}
