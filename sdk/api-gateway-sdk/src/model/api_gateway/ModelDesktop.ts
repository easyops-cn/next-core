import { ModelDesktopItem } from "./index.js";

/** app展示视图 */
export interface ModelDesktop {
  /** 桌面名称 */
  name: string;

  /** 排序 */
  order: number;

  /** 桌面元素列表 */
  items: Partial<ModelDesktopItem>[];
}
