import { ModelInstalledMicroAppBootstrap } from "../micro_app/index.js";

/** 初始化配置 */
export interface ModelStoryBoard {
  /** 小产品基本信息 */
  app: Partial<ModelInstalledMicroAppBootstrap>;

  /** dependsAll */
  dependsAll: boolean;

  /** 路由配置 */
  routes: Record<string, any>[];

  /** 元数据信息 */
  meta: Record<string, any>;
}
