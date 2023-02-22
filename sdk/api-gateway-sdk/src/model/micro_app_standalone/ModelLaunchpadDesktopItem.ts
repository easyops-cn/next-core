/** Launchpad桌面元素 */
export interface ModelLaunchpadDesktopItem {
  /** 元素类型 */
  type: "app" | "dir";

  /** 小产品id */
  id: string;

  /** dir/custom名称 */
  name: string;

  /** custom_item.url */
  url: string;

  /** 元素位置 */
  position: number;

  /** 小产品列表(type为dir时有效) */
  items: Partial<ModelLaunchpadDesktopItem>[];
}
