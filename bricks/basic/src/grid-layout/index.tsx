import React, { CSSProperties } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import type { ComponentSize as MediaSize } from "../interface.js";
import styleText from "./grid-layout.shadow.css";

const { defineElement, property } = createDecorators();

export interface ResponsiveSettings {
  large?: GridSettings;
  middle?: GridSettings;
  small?: GridSettings;
  xs?: GridSettings;
}
export interface GridSettings {
  columns?: number;
  rows?: number;
  templateColumns?: string;
  columnSpan?: number;
  rowSpan?: number;
}

const mediaSizeList: MediaSize[] = ["large", "middle", "small", "xs"];

const mediaQueryMap: Record<MediaSize, string> = {
  large: "(max-width: 1920px)",
  middle: "(max-width: 1600px)",
  small: "(max-width: 1280px)",
  xs: "(max-width: 1024px)",
};

/**
 * @id basic.grid-layout
 * @name basic.grid-layout
 * @docKind brick
 * @description 提供多行多列的响应式网格布局
 * @author abert
 *
 */
@defineElement("basic.grid-layout", {
  styleTexts: [styleText],
})
class GridLayout extends ReactNextElement {
  #sizeMatch: Partial<Record<MediaSize, boolean>> = {};
  // eslint-disable-next-line @typescript-eslint/ban-types
  #mediaMatchListeners: Function[] = [];
  /**
   * @kind number
   * @default -
   * @description 	网格布局列数（各列等宽）
   * @group basic
   */
  @property({
    attribute: false,
  })
  accessor columns: number | undefined;
  /**
   * @kind number
   * @default 1
   * @description 	网格布局行数，通常不需设置，各行高度由内容决定。设置为 > 1 时，各行高度相同。
   * @group basic
   */
  @property({
    type: Number,
  })
  accessor rows = 1;

  /**
   * @kind number
   * @default 1
   * @description 自己在父级网格中所占行数
   * @group basic
   */
  @property({
    type: Number,
  })
  accessor rowSpan = 1;

  /**
   * @kind number
   * @default 1
   * @description 自己在父级网格中所占列数
   * @group basic
   */
  @property({
    type: Number,
  })
  accessor columnSpan = 1;

  /**
   * @default
   * @required false
   * @description 网格布局模板列，即 CSS 的 gridTemplateColumns，优先于 `columns`。
   */
  @property({
    attribute: false,
  })
  accessor templateColumns: string | undefined;

  /**
   * @default
   * @required false
   * @description  设置单元格的垂直位置
   */
  @property({
    attribute: false,
  })
  accessor alignItems: CSSProperties["alignItems"] | undefined;
  /**
   * @default
   * @required false
   * @description 设置整个内容区域的垂直位置
   */
  @property({
    attribute: false,
  })
  accessor alignContent: CSSProperties["alignContent"] | undefined;
  /**
   * @default
   * @required false
   * @description 设置单元格内容的水平位置
   */
  @property({
    attribute: false,
  })
  accessor justifyItems: CSSProperties["justifyItems"] | undefined;
  /**
   * @default
   * @required false
   * @description 设置整个内容区域在容器里面的水平位置
   */
  @property({
    attribute: false,
  })
  accessor justifyContent: CSSProperties["justifyContent"] | undefined;

  /**
   * @default
   * @required false
   * @description  子元素自动排布顺序
   */
  @property({
    attribute: false,
  })
  accessor autoFlow: CSSProperties["gridAutoFlow"] | undefined;

  /**
   * @kind ResponsiveSettings
   * @default 1
   * @description 响应式布局设置
   * @group basic
   */
  @property({
    attribute: false,
  })
  accessor responsive: ResponsiveSettings | undefined;

  /**
   * @kind string
   * @default "var(--page-card-gap)"
   * @description 子元素之间的间距
   * @group basic
   */
  @property({
    type: String,
  })
  accessor gap = "var(--page-card-gap)";

  /**
   * @kind Boolean
   * @default false
   * @description 是否展示网格布局边框
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor showGridBorder = false;

  /**
   * @kind string
   * @default #454547
   * @description 网格布局边框颜色
   */
  @property({
    attribute: false,
  })
  accessor gridBorderColor: string | undefined;

  connectedCallback(): void {
    this._clearMediaMatchListeners();
    if (window.matchMedia && this.responsive) {
      for (const [media, query] of Object.entries(mediaQueryMap)) {
        if (this.responsive[media as MediaSize]) {
          const mediaMatch = window.matchMedia(query);
          this.#sizeMatch[media as MediaSize] = mediaMatch.matches;
          const handler = (e: MediaQueryListEvent): void => {
            this.#sizeMatch[media as MediaSize] = e.matches;
            this.render();
          };
          if (mediaMatch.addEventListener) {
            mediaMatch.addEventListener("change", handler);
            this.#mediaMatchListeners.push(() => {
              mediaMatch.removeEventListener("change", handler);
            });
          } else {
            mediaMatch.addListener(handler);
            this.#mediaMatchListeners.push(() => {
              mediaMatch.removeListener(handler);
            });
          }
        }
      }
    }
    super.connectedCallback();

    const style = `
      .grid-border {
        border-top: 1px solid var(--grid-border-color);
        border-left: 1px solid var(--grid-border-color);
      }
      .grid-border > * {
        border-bottom: 1px solid var(--grid-border-color);
        border-right: 1px solid var(--grid-border-color);
      }
      
      .grid-border-with-gap > * {
        border: 1px solid var(--grid-border-color);
      }
    `;
    const styleEle = document.createElement("style");
    styleEle.textContent = style;
    this.appendChild(styleEle);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearMediaMatchListeners();
    this.#sizeMatch = {};
  }

  _clearMediaMatchListeners(): void {
    // eslint-disable-next-line @typescript-eslint/ban-types
    let fn: Function | undefined;
    while ((fn = this.#mediaMatchListeners.pop())) {
      fn();
    }
  }

  handleShowGridBorder(): void {
    if (this.showGridBorder) {
      this.style.setProperty(
        "--grid-border-color",
        this.gridBorderColor ?? "#454547"
      );
      this.classList.add(
        parseInt(this.gap) === 0 ? "grid-border" : "grid-border-with-gap"
      );
    } else {
      if (this.style.getPropertyValue("--grid-border-color")) {
        this.style.removeProperty("--grid-border-color");
      }
      const keys = Array.from(this.classList).filter(
        (item) =>
          item.startsWith("grid-border") ||
          item.startsWith("grid-border-with-gap")
      );
      if (keys.length) {
        this.classList.remove(...keys);
      }
    }
  }

  #initLayout() {
    const layout = {
      columns: this.columns,
      rows: this.rows,
      columnSpan: this.columnSpan,
      rowSpan: this.rowSpan,
    };

    for (const size of mediaSizeList) {
      if (this.#sizeMatch[size]) {
        Object.assign(layout, this.responsive?.[size]);
      }
    }

    return {
      columns: layout.columns || 1,
      rows: layout.rows || 1,
      columnSpan: layout.columnSpan || 1,
      rowSpan: layout.rowSpan || 1,
    };
  }

  render() {
    const { columnSpan, rowSpan, columns, rows } = this.#initLayout();

    const gridProps: CSSProperties = {
      justifyContent: this.justifyContent,
      justifyItems: this.justifyItems,
      alignContent: this.alignContent,
      alignItems: this.alignItems,
      gridAutoFlow: this.autoFlow,
      gridGap: this.gap,
      gap: this.gap,
      gridColumn: columnSpan === 1 ? "" : `span ${columnSpan}`,
      gridRow: rowSpan === 1 ? "" : `span ${rowSpan}`,
      gridTemplateColumns:
        this.templateColumns || columns === 1 ? "" : `repeat(${columns},1fr)`,
      gridTemplateRows: rows === 1 ? "" : `repeat(${rows},1fr)`,
    };

    Object.entries(gridProps).forEach(([key, value]) => {
      if (value != null) {
        this.style[key as any] = value;
      }
    });

    this.handleShowGridBorder();

    return <slot />;
  }
}

export { GridLayout };
