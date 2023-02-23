import { ModelLaunchpadDesktopItem } from "./index.js";

/** Launchpad桌面容器 */
export interface ModelLaunchpadDesktop {
  /** 桌面名称 */
  name: string;

  /** 排序 */
  order: number;

  /** 桌面元素列表 */
  items: Partial<ModelLaunchpadDesktopItem>[];
}
