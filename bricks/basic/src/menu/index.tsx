import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import styleText from "./menu.shadow.css";

const { defineElement } = createDecorators();

/**
 * @id basic.general-menu
 * @name basic.general-menu
 * @docKind brick
 * @description 菜单构件
 * @author sailor
 *
 */
@defineElement("basic.general-menu", {
  styleTexts: [styleText],
})
class Menu extends ReactNextElement {
  render() {
    return <slot />;
  }
}
export { Menu };
