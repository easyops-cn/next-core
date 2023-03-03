import React, { createRef } from "react";
import { EventEmitter, createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import imageComponentStyleText from "./imageComponent.shadow.css";
import previewStyleText from "./preview.shadow.css";
import "@next-core/theme";
import {
  ImageConfig,
  ImageList,
  ImageListProps,
  ImageListRef,
} from "./ImageList.js";

const { defineElement, property, method, event } = createDecorators();

/**
 * @id basic.general-image
 * @name basic.general-image
 * @docKind brick
 * @description 通用图片构件
 * @author nlicro
 * @noInheritDoc
 */
@defineElement("basic.general-image", {
  styleTexts: [imageComponentStyleText, previewStyleText],
})
class Image extends ReactNextElement implements ImageListProps {
  private _ImageListRef = createRef<ImageListRef>();

  /**
   * @kind ImageConfig[]
   * @required false
   * @default -
   * @description 图片列表
   * @group basic
   */
  @property({ attribute: false }) accessor imgList: ImageConfig[] | undefined;

  /**
   * @description 打开预览框
   */
  @method()
  open(index?: number) {
    this._ImageListRef.current?.openPreview(index);
  }

  /**
   * @description 关闭预览框
   */
  @method()
  close() {
    this._ImageListRef.current?.closePreview();
  }

  /**
   * @detail boolean
   * @description 预览改变事件
   */
  @event({ type: "visibleChange" })
  accessor #visibleChange!: EventEmitter<boolean>;
  #handleVisibleChange = (visible: boolean) => {
    this.#visibleChange.emit(visible);
  };

  render() {
    return (
      <ImageList
        ref={this._ImageListRef}
        imgList={this.imgList}
        onVisibleChange={this.#handleVisibleChange}
      />
    );
  }
}

export { Image };
