import React, { useEffect, useMemo, useRef, useState } from "react";
import { createDecorators, type EventEmitter } from "@next-core/element";
import { ReactNextElement, wrapBrick } from "@next-core/react-element";

import styleText from "./card.shadow.css";
import "@next-core/theme";
import { Button, ButtonProps } from "../button";
import { isEmpty } from "lodash";

export interface OperationButton {
  id: string;
  eventName: string;
  configProps: ButtonProps & { icon?: string };
  tooltip?: string;
  text?: string;
  needData?: boolean;
}

export interface CardProps {
  cardTitle?: string;
  fillVertical?: boolean;
  verticalCenter?: boolean;
  hasExtraSlot?: boolean;
  isFixedFooter?: boolean;
  operationButtons?: OperationButton[];
}
const WrappedButton = wrapBrick<Button, ButtonProps>("basic.general-button");

const { defineElement, property } = createDecorators();
/**
 * @id basic.general-card
 * @name basic.general-card
 * @docKind brick
 * @description 通用卡片构件
 * @author julielai
 * @noInheritDoc
 */

@defineElement("basic.general-card", {
  styleTexts: [styleText],
})
class Card extends ReactNextElement implements CardProps {
  /**
   * @kind string
   * @required false
   * @default -
   * @description 标题
   * @group basic
   */
  @property() accessor cardTitle: string | undefined;

  /**
   * @kind boolean
   * @required false
   * @default false
   * @description 设置该属性后，设置卡片高度为 100%，卡片高度会自动撑满父容器
   * @group ui
   */
  @property({
    type: Boolean,
  })
  accessor fillVertical: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default false
   * @description 设置该属性后，卡片内容区的元素自动垂直居中
   * @group ui
   */
  @property({
    type: Boolean,
  })
  accessor verticalCenter: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default false
   * @description 是否右上角有操作区 slot
   * @group advanced
   */
  @property({
    type: Boolean,
  })
  accessor hasExtraSlot: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default true
   * @description footer滚动到窗口外时，是否需要将footer固定在窗口底部
   * @group advanced
   */
  @property({
    attribute: false,
  })
  accessor isFixedFooter = true;

  /**
   * @kind OperationButton[]
   * @required false
   * @default -
   * @description 右上角的操作按钮列表，可自定义指定该按钮的名字，按钮点击后发出的事件等
   * @group advanced
   */
  @property({ attribute: false })
  accessor operationButtons: OperationButton[] = [];

  render() {
    return (
      <CardComponent
        cardTitle={this.cardTitle}
        fillVertical={this.fillVertical}
        verticalCenter={this.verticalCenter}
        hasExtraSlot={this.hasExtraSlot}
        isFixedFooter={this.isFixedFooter}
        operationButtons={this.operationButtons}
      />
    );
  }
}

export function CardComponent({
  cardTitle,
  fillVertical,
  verticalCenter,
  hasExtraSlot,
  isFixedFooter,
  operationButtons,
}: CardProps) {
  const [paddingBottom, setPaddingBottom] = useState(0);
  const [fixedStyle, setFixedStyle] = useState({});
  const footerRef = useRef<HTMLDivElement>(null);

  const renderButtons = useMemo(
    () =>
      operationButtons?.map((button, index) => {
        return (
          <WrappedButton {...button.configProps} id={button.id} key={button.id}>
            {button.text}
          </WrappedButton>
        );
      }),
    [operationButtons]
  );

  const header = useMemo(
    () => (
      <div className="card-head">
        <div className="card-head-wrapper">
          {cardTitle && (
            <div className="card-head-title">
              {cardTitle}
              <slot id="titleSlot" name="titleSuffix" />
            </div>
          )}
          {(hasExtraSlot || !isEmpty(operationButtons)) && (
            <div className="card-extra">
              {isEmpty(operationButtons) ? null : renderButtons}
              <slot name="extra"></slot>
            </div>
          )}
        </div>
      </div>
    ),
    [cardTitle, hasExtraSlot, operationButtons]
  );

  const handleFooter = () => {
    if (!isEmpty(footerRef.current)) {
      const rootNodeRect = footerRef.current?.getBoundingClientRect();
      const top = rootNodeRect?.bottom - window.innerHeight;
      if (top <= 0) {
        setFixedStyle({});
      } else {
        setFixedStyle({
          position: "fixed",
          left: rootNodeRect?.left,
          bottom: 0,
          width: footerRef.current?.clientWidth,
        });
      }
    }
  };

  useEffect(() => {
    if (!isEmpty(footerRef.current)) {
      const resizeObserver = new ResizeObserver(() => {
        if (
          paddingBottom !== footerRef.current?.clientHeight &&
          footerRef.current?.clientHeight
        ) {
          setPaddingBottom(footerRef.current?.clientHeight);
          if (isFixedFooter) {
            handleFooter();
          }
        }
      });
      resizeObserver.observe(footerRef?.current);

      if (isFixedFooter) {
        window.addEventListener("scroll", handleFooter);
        window.addEventListener("resize", handleFooter);
      }
      return () => {
        resizeObserver.disconnect();
        if (isFixedFooter) {
          window.removeEventListener("scroll", handleFooter);
          window.removeEventListener("resize", handleFooter);
        }
      };
    }
  }, [isFixedFooter]);

  return (
    <div
      className="card"
      style={{
        ...(fillVertical ? { height: "100%" } : {}),
        ...(verticalCenter
          ? { display: "grid", gridTemplate: "50px auto/auto" }
          : {}),
        paddingBottom,
      }}
    >
      {(cardTitle || hasExtraSlot) && header}
      <div
        className="card-body"
        style={
          verticalCenter
            ? {
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }
            : {}
        }
      >
        <div>
          <slot></slot>
        </div>
      </div>
      <div
        className="card-footer"
        ref={footerRef}
        style={{
          ...fixedStyle,
          ...(paddingBottom ? {} : { padding: 0 }),
        }}
      >
        <slot name="footer"></slot>
      </div>
    </div>
  );
}

export { Card };
