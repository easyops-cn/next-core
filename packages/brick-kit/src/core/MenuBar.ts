import { Kernel } from "./exports";
import { getDllAndDepsOfBricks, loadScript } from "@easyops/brick-utils";
import { MenuBarBrick, SidebarMenu } from "@easyops/brick-types";

export class MenuBar {
  public element: MenuBarBrick;

  constructor(private kernel: Kernel) {}

  async bootstrap(): Promise<void> {
    const { navbar, brickPackages } = this.kernel.bootstrapData;
    const { dll, deps } = getDllAndDepsOfBricks(
      [navbar.menuBar],
      brickPackages
    );
    await loadScript(dll);
    await loadScript(deps);
    this.element = document.createElement(navbar.menuBar) as MenuBarBrick;
    this.kernel.mountPoints.menuBar.appendChild(this.element);
  }

  /**
   * 设置应用菜单（左侧菜单）
   * @param menu 菜单
   */
  setAppMenu(menu: SidebarMenu): void {
    this.element.menu = menu;
  }

  /**
   * 折叠/展开应用菜单
   * @param collapsed
   */
  collapse(collapsed: boolean): void {
    this.element.collapsed = collapsed;
  }

  /**
   * 检查应用菜单是否处于折叠状态
   */
  isCollapsed(): boolean {
    return this.element.collapsed;
  }

  /**
   * 应用菜单已折叠时*软展开/收回*
   * @param collapsed
   */
  softExpand(expanded: boolean): void {
    this.element.softExpanded = expanded;
  }

  /**
   * 应用菜单是否处于*软展开*状态
   * @param collapsed
   */
  isSoftExpanded(): boolean {
    return this.element.softExpanded;
  }
}
