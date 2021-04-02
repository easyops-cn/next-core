import { AppBarBrick, BreadcrumbItemConf } from "@next-core/brick-types";
import { BaseBar } from "./BaseBar";

export class AppBar extends BaseBar {
  public element: AppBarBrick;

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
