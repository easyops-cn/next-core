import React, { useEffect, useRef } from "react";
import { createDecorators, type EventEmitter } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import { Layout, MessageBody } from "../interface.js";
import { Form } from "antd-mobile";

const { defineElement, property, event, method } = createDecorators();

/**
 * @id itsc-mobile.general-form
 * @name itsc-mobile.general-form
 * @docKind brick
 * @description 通用输入框构件
 * @author frank
 * @noInheritDoc
 */
@defineElement("itsc-mobile.general-form", {
  styleTexts: [],
})
class GeneralFormElement extends ReactNextElement {
  readonly isFormElement = true;
  #_values!: Record<string, unknown>;
  formUtils: any;

  set values(value: Record<string, unknown>) {
    this.#_values = value;

    this.#_setInitValue(value);
  }
  get values(): Record<string, unknown> {
    return this.#_values;
  }

  #_setInitValue(values: Record<string, unknown>) {
    this.formUtils.setFieldsValue(values);
    this._forceUpdate();
  }

  /**
   * @description 设置表单域内字段 id 的前缀
   * @required false
   * @group basic
   */
  @property() accessor name: string;

  @property() accessor layout: Layout = "horizontal";

  /**
   * @description 表单样式
   * @group ui
   */
  @property() accessor formStyle: React.CSSProperties;

  /**
   * @detail
   * @description
   */
  @event({ type: "values.change" }) accessor #valuesChangeEvent!: EventEmitter<
    Record<string, unknown>
  >;
  handleValuesChange = (values: Record<string, unknown>) => {
    this.#valuesChangeEvent.emit(values);
  };

  /**
   * @description 表单验证成功时触发
   */
  @event({ type: "validate.success" }) accessor #successEvent!: EventEmitter<
    Record<string, unknown>
  >;
  /**
   * @description 表单验证报错时触发
   */
  @event({ type: "validate.error" }) accessor #errorEvent!: EventEmitter<
    MessageBody[]
  >;

  /**
   * @description
   */
  @method()
  validate(): void {
    this.lowLevelValidate();
  }

  lowLevelValidate(callback?: (params?: any) => void): void {
    this.formUtils.validateFields((err, values) => {
      if (err) {
        this.#errorEvent.emit(err);
      } else {
        if (callback) {
          callback(values);
        }
        this.#successEvent.emit(values);
      }
    });
  }

  /**
   * @description
   */
  @method()
  setInitValue(
    values: Record<string, unknown>,
    options?: { runInMicrotask?: boolean; runInMacrotask?: boolean }
  ) {
    if (options) {
      options.runInMicrotask &&
        queueMicrotask(() => {
          this.#_setInitValue(values);
        });
      options.runInMacrotask &&
        setTimeout(() => {
          this.#_setInitValue(values);
        });
    } else {
      this.#_setInitValue(values);
    }
  }

  /**
   * @description
   */
  @method()
  resetFields(name?: string) {
    this.formUtils.resetFields(name);
  }

  /**
   * @description
   */
  @method()
  getFieldsValue(options?: {
    runInMicrotask?: boolean;
    runInMacrotask?: boolean;
  }) {
    if (!(options?.runInMicrotask || options?.runInMacrotask)) {
      return this.formUtils.getFieldsValue();
    }
    return new Promise((resolve, reject) => {
      options.runInMicrotask &&
        queueMicrotask(() => resolve(this.formUtils.getFieldsValue()));
      options.runInMacrotask &&
        setTimeout(() => resolve(this.formUtils.getFieldsValue()));
    });
  }

  private _forceUpdate(element = this): void {
    const renderedElementSet = new WeakSet<HTMLElement>();

    this._forceUpdateSlot(element, renderedElementSet);
    this._forceUpdateChild(element, renderedElementSet);
  }

  private _forceUpdateChild(
    element: HTMLElement = this,
    renderedElementSet: WeakSet<HTMLElement>
  ): void {
    if (
      (element as any).isFormItemElement &&
      !renderedElementSet.has(element)
    ) {
      // Manually trigger to render validation messages.
      (element as any).render?.();
      if (element.nodeName !== "FORMS.GENERAL-FORM-ITEM") {
        return;
      }
    }

    element.childNodes.forEach((child) => {
      this._forceUpdateChild(child as HTMLElement, renderedElementSet);
    });
  }

  private _forceUpdateSlot(
    element: HTMLElement = this,
    renderedElementSet: WeakSet<HTMLElement>
  ): void {
    if (element.shadowRoot) {
      const slots = element.shadowRoot.querySelectorAll(
        "slot"
      ) as NodeListOf<HTMLSlotElement>;
      if (slots.length) {
        slots.forEach((slot) => {
          slot.assignedNodes().forEach((node: any) => {
            if (typeof node.render === "function") {
              // Manually trigger to render validation messages.
              node.render();
              renderedElementSet.add(node);
            }
          });
        });
      }
    }
  }

  render() {
    return (
      <FormComponent
        formElement={this}
        name={this.name}
        layout={this.layout}
        onValuesChange={this.handleValuesChange}
        formStyle={this.formStyle}
      />
    );
  }
}

interface FormComponentProps {
  name: string;
  layout?: Layout;
  formElement: any;
  formStyle?: React.CSSProperties;
  onValuesChange: (values: Record<string, unknown>) => void;
}

export function FormComponent(props: FormComponentProps) {
  const { name, layout, formElement, formStyle, onValuesChange } = props;

  const ref = useRef();

  useEffect(() => {
    formElement.formUtils = ref.current;
  }, []);

  return (
    <div className="form-container">
      <Form
        ref={ref}
        name={name}
        layout={layout}
        style={{
          ...formStyle,
        }}
        onValuesChange={(_, values) => onValuesChange?.(values)}
      >
        <slot></slot>
      </Form>
    </div>
  );
}

export { GeneralFormElement };
