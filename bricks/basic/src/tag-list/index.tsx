import React, { useCallback, useMemo } from "react";
import { EventEmitter, createDecorators } from "@next-core/element";
import { ReactNextElement, wrapBrick } from "@next-core/react-element";
import {
  TagColor,
  Tag,
  TagProps,
  TagEvents,
  TagMapEvents,
} from "../tag/index.js";
import { ComponentSize } from "../interface.js";
import "@next-core/theme";

const { defineElement, property, event } = createDecorators();

const WrappedTag = wrapBrick<Tag, TagProps, TagEvents, TagMapEvents>(
  "basic.general-tag",
  {
    onCheck: "check",
    onClose: "close",
  }
);

type tagListItem = TagProps & { text: string };

interface TagListComponentProps {
  list?: Array<tagListItem | string>;
}

/**
 * @id basic.general-tag-list
 * @name basic.general-tag-list
 * @docKind brick
 * @description 标签列表构件
 * @author sailor
 */
@defineElement("basic.general-tag-list", {
  styleTexts: [],
})
class TagList extends ReactNextElement {
  /**
   * @kind TagComponentProps[]
   * @required false
   * @default -
   * @description 标签列表
   * @group basic
   */
  @property({
    attribute: false,
  })
  accessor list: Array<tagListItem | string> | undefined;

  /**
   * @kind ComponentSize
   * @required false
   * @default middle
   * @description 按钮大小
   * @enums
   * @group basic
   */
  @property() accessor size: ComponentSize | undefined;

  /**
   * @kind TagColor | string
   * @required false
   * @default -
   * @description 颜色
   * @group basic
   */
  @property()
  accessor color: TagColor | string | undefined;

  /**
   * @kind boolean
   * @required false
   * @default -
   * @description 是否禁用
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor disabled: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default -
   * @description 是否允许关闭
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor closable: boolean | undefined;

  /**
   * @kind boolean
   * @required false
   * @default -
   * @description 是否允许选择
   * @group basic
   */
  @property({
    type: Boolean,
  })
  accessor checkable: boolean | undefined;

  /**
   * @kind React.CSSProperties
   * @required false
   * @default -
   * @description 标签自定义样式
   * @group basic
   */
  @property({
    attribute: false,
  })
  accessor tagStyle: React.CSSProperties | undefined;

  #matchItem(text: string) {
    return this.list?.find((listItem) =>
      typeof listItem === "string" ? listItem === text : listItem.text === text
    );
  }

  /**
   * @detail
   * @description 选择标签事件
   */
  @event({ type: "check" })
  accessor #checkEvent!: EventEmitter<{
    item: tagListItem | string | undefined;
    list: tagListItem[];
  }>;

  handleCheck = (item: tagListItem, list: tagListItem[]): void => {
    this.#checkEvent.emit({
      item: this.#matchItem(item.text),
      list,
    });
  };

  /**
   * @detail
   * @description 关闭标签事件
   */
  @event({ type: "close" })
  accessor #closeEvent!: EventEmitter<{
    item: tagListItem | string | undefined;
    list: tagListItem[];
  }>;

  handleClose = (item: tagListItem, list: tagListItem[]): void => {
    this.#closeEvent.emit({
      item: this.#matchItem(item.text),
      list,
    });
  };

  render() {
    return (
      <TagListComponent
        list={this.list}
        size={this.size}
        color={this.color}
        disabled={this.disabled}
        closable={this.closable}
        checkable={this.checkable}
        tagStyle={this.tagStyle}
        onCheck={this.handleCheck}
        onClose={this.handleClose}
      />
    );
  }
}

function TagListComponent({
  list,
  size = "middle",
  color,
  disabled,
  closable,
  checkable,
  tagStyle,
  onCheck,
  onClose,
}: TagListComponentProps &
  TagProps & {
    onCheck: (item: tagListItem, list: tagListItem[]) => void;
    onClose: (item: tagListItem, list: tagListItem[]) => void;
  }) {
  const computedList = useMemo(() => {
    return (
      list?.map((item) => {
        return typeof item === "string"
          ? {
              text: item,
            }
          : item;
      }) ?? []
    );
  }, [list]);

  const handleCheck = useCallback(
    (tag: tagListItem): void => {
      tag.checked = !tag.checked;
      onCheck?.(
        tag,
        computedList?.filter((item) => item.checked && !item.hide)
      );
    },
    [computedList, onCheck]
  );

  const handleClose = useCallback(
    (tag: tagListItem) => {
      tag.hide = !tag.hide;
      if (tag.checked) {
        handleCheck(tag);
      }
      onClose?.(
        tag,
        computedList?.filter((item) => !item.hide)
      );
    },
    [computedList, handleCheck, onClose]
  );

  return (
    <div className="tag-list">
      {computedList.map((tag, index) => {
        return (
          <WrappedTag
            size={size}
            color={color}
            disabled={disabled}
            closable={closable}
            checkable={checkable}
            tagStyle={tagStyle}
            key={index}
            {...tag}
            onCheck={() => handleCheck(tag)}
            onClose={() => handleClose(tag)}
          >
            {tag.text}
          </WrappedTag>
        );
      })}
    </div>
  );
}

export { TagList };
