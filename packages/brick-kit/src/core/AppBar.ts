import { getDllAndDepsOfBricks, loadScript } from "@easyops/brick-utils";
import { AppBarBrick, BreadcrumbItemConf } from "@easyops/brick-types";
import { Kernel } from "./exports";

export class AppBar {
  public element: AppBarBrick;

  constructor(private kernel: Kernel) {}

  async bootstrap(): Promise<void> {
    const { navbar, brickPackages } = this.kernel.bootstrapData;
    const { dll, deps } = getDllAndDepsOfBricks([navbar.appBar], brickPackages);
    await loadScript(dll);
    await loadScript(deps);
    this.element = document.createElement(navbar.appBar) as AppBarBrick;
    this.kernel.mountPoints.appBar.appendChild(this.element);
  }

  /**
   * 设置页面标题（顶部）
   * @param pageTitle 标题
   */
  setPageTitle(pageTitle: string): void {
    this.element.pageTitle = pageTitle;
  }

  /**
   * 追加面包屑
   * @param breadcrumb 面包屑配置
   */
  appendBreadcrumb(breadcrumb: BreadcrumbItemConf[]): void {
    this.element.breadcrumb = [...this.element.breadcrumb, ...breadcrumb];
  }

  /**
   * 设置面包屑
   * @param breadcrumb 面包屑配置
   */
  setBreadcrumb(breadcrumb: BreadcrumbItemConf[]): void {
    this.element.breadcrumb = breadcrumb;
  }
}
