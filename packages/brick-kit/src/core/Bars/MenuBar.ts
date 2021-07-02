import { MenuBarBrick, SidebarMenu } from "@next-core/brick-types";
import { BaseBar } from "./BaseBar";

export class MenuBar extends BaseBar {
  // `element` is not available in business layout.
  public declare element: MenuBarBrick;

  /**
   * 设置应用菜单（左侧菜单）
   * @param menu - 菜单
   */
  setAppMenu(menu: SidebarMenu): void {
    if (!this.element) {
      return;
    }
    this.element.menu = menu;
  }

  /**
   * 重置应用菜单（左侧菜单）
   */
  resetAppMenu(): void {
    if (!this.element) {
      return;
    }
    this.element.menu = null;
    this.element.subMenu = null;
  }

  /**
   * 折叠/展开应用菜单
   * @param collapsed
   */
  collapse(collapsed: boolean): void {
    if (!this.element) {
      return;
    }
    this.element.collapsed = collapsed;
  }

  /**
   * 检查应用菜单是否处于折叠状态
   */
  isCollapsed(): boolean {
    return this.element?.collapsed;
  }

  /**
   * 应用菜单已折叠时*软展开/收回*
   * @param collapsed
   */
  softExpand(expanded: boolean): void {
    if (!this.element) {
      return;
    }
    this.element.softExpanded = expanded;
  }

  /**
   * 应用菜单是否处于*软展开*状态
   * @param collapsed
   */
  isSoftExpanded(): boolean {
    return this.element?.softExpanded;
  }
}
