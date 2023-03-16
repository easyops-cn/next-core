import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import styleText from "./micro-view.shadow.css";

const { defineElement, property } = createDecorators();

interface MicroViewProps {
  pageTitle?: string;
  hasToolbar?: boolean;
  callback: (element: HTMLDivElement) => void;
}

/**
 * @id containers.micro-view
 * @name containers.micro-view
 * @docKind brick
 * @description 基础页面布局
 * @author sailorshe
 *
 */
@defineElement("containers.micro-view", {
  styleTexts: [styleText],
})
class MicroView extends ReactNextElement {
  /**
   * @default -
   * @required false
   * @description 页面标题
   */
  @property()
  accessor pageTitle: string | undefined;

  @property()
  accessor hasToolbar: boolean | undefined;

  renderCallback = () => {
    const slotToolbar = this.#getSlotBySelector("slot[name='toolbar']");
    slotToolbar?.addEventListener("slotchange", () => {
      if (slotToolbar.assignedElements().length) {
        this.hasToolbar = true;
      }
    });
  };

  #getSlotBySelector(selector: string): HTMLSlotElement {
    return this.shadowRoot?.querySelector(selector) as HTMLSlotElement;
  }

  render() {
    return (
      <MicroViewElement
        pageTitle={this.pageTitle}
        hasToolbar={this.hasToolbar}
        callback={this.renderCallback}
      />
    );
  }
}

function MicroViewElement({
  pageTitle,
  hasToolbar,
  callback,
}: MicroViewProps): React.ReactElement {
  return (
    <div className="micro-view-wrapper" ref={callback}>
      <div className="header">
        {pageTitle && <div className="page-title">{pageTitle}</div>}
        <div className="toolbar">
          <slot name="toolbar" />
        </div>
      </div>
      <div className="body">
        <slot />
      </div>
    </div>
  );
}

export { MicroView };
