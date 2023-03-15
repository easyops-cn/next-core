import React, { useMemo } from "react";
import { EventEmitter, createDecorators } from "@next-core/element";
import { ReactNextElement, wrapBrick } from "@next-core/react-element";
import styleText from "./tab.shadow.css";
import classNames from "classnames";
import type { TabItem, TabItemProps } from "./tab-item/index.js";

const { defineElement, property, event } = createDecorators();

const WrappedTabItem = wrapBrick<TabItem, TabItemProps>("containers.tab-item");

interface TabListProps {
  tabs?: TabItemProps[] | string[];
  activeKey?: string;
  showCard?: boolean;
  onTabSelect: (key: string) => void;
  callback: (element: HTMLDivElement) => void;
}

/**
 * @id containers.tab-list
 * @name containers.tab-list
 * @docKind brick
 * @description tab容器构件
 * @author sailorshe
 *
 */
@defineElement("containers.tab-list", {
  styleTexts: [styleText],
})
class TabList extends ReactNextElement {
  #defaultActiveKey?: string;
  /**
   * @default -
   * @required false
   * @description 标签页列表
   */
  @property({
    attribute: false,
  })
  accessor tabs: TabItemProps[] | string[] | undefined;

  /**
   * @default 默认第一个
   * @required -
   * @description 激活状态 tab 栏的 key
   */
  @property()
  accessor activeKey: string | undefined;

  /**
   * @default true
   * @required false
   * @description 是否展示背景
   */
  @property({
    type: Boolean,
  })
  accessor showCard: boolean | undefined;

  // https://github.com/reactwg/react-18/discussions/5
  renderCallback = () => {
    const slotToolbar = this.#getSlotBySelector("#contentSlot");
    slotToolbar?.addEventListener("slotchange", () => {
      const tabElements = slotToolbar?.assignedElements() as HTMLElement[];
      if (!tabElements?.length) return;
      if (!this.tabs?.length) {
        this.tabs = new Array(tabElements.length).fill(null).map((_, index) => {
          return `Tab ${index + 1}`;
        });
      }
      this.#initTab();
      this.#initSelect();
    });
  };

  #getTabKey(tab: TabItemProps | string) {
    return typeof tab === "string" ? tab : tab.key;
  }

  #getSlotBySelector(selector: string): HTMLSlotElement {
    return this.shadowRoot?.querySelector(selector) as HTMLSlotElement;
  }

  #initTab() {
    const slotToolbar = this.#getSlotBySelector("#contentSlot");
    const tabElements = slotToolbar?.assignedElements() as HTMLElement[];
    if (tabElements?.length && this.tabs?.length) {
      this.tabs.forEach((tab, index) => {
        tabElements[index]?.setAttribute("key", this.#getTabKey(tab));
      });
    }
  }

  #initSelect() {
    if (this.tabs?.length) {
      this.#defaultActiveKey = this.activeKey || this.#getTabKey(this.tabs[0]);
      this.#handleTabSelect(this.#defaultActiveKey, true);
    }
  }

  /**
   * @detail
   * @description tab切换事件
   */
  @event({ type: "change" })
  accessor #tabSelectChangeEvent!: EventEmitter<string>;

  #handleTabSelect = (key: string, isInit = false) => {
    const slotToolbar = this.#getSlotBySelector("#contentSlot");
    const tabElement = slotToolbar?.assignedElements() as HTMLElement[];
    if (!tabElement) return;
    tabElement?.forEach((element) => {
      if (element.getAttribute("key") === key) {
        element.hidden = false;
      } else {
        element.hidden = true;
      }
    });
    if (!isInit) {
      this.activeKey = key;
      this.#tabSelectChangeEvent.emit(key);
    }
  };

  render() {
    this.#initTab();
    this.#initSelect();
    return (
      <TabListElement
        tabs={this.tabs}
        activeKey={this.activeKey || this.#defaultActiveKey}
        showCard={this.showCard}
        onTabSelect={this.#handleTabSelect}
        callback={this.renderCallback}
      />
    );
  }
}

function TabListElement({
  tabs,
  activeKey,
  showCard = true,
  onTabSelect,
  callback,
}: TabListProps): React.ReactElement {
  const renderTabs = useMemo((): TabItemProps[] => {
    if (tabs?.length) {
      return tabs.map((tab) => {
        return typeof tab === "string"
          ? {
              text: tab,
              key: tab,
            }
          : tab;
      });
    }
    return [];
  }, [tabs]);

  const handleTabSelect = (tab: TabItemProps) => {
    if (tab.disabled) return;
    onTabSelect(tab.key);
  };

  return (
    <div
      className={classNames("tab-wrapper", {
        "show-card": showCard,
      })}
      ref={callback}
    >
      <div className={classNames("tab-nav")}>
        <div className="tab-item-wrapper">
          {renderTabs.map((tab) => {
            return (
              <WrappedTabItem
                key={tab.key}
                active={activeKey === tab.key}
                {...tab}
                onClick={() => handleTabSelect(tab)}
              />
            );
          })}
        </div>
        <div className="extra">
          <slot name="extra" />
        </div>
      </div>
      <div className="content">
        <slot id="contentSlot" />
      </div>
    </div>
  );
}

export { TabList };
