/** 初始化配置 */
export interface ModelSettings {
  /** 特性开关 */
  featureFlags: Record<string, any>;

  /** 首页地址 */
  homepage: string;

  /** 品牌设置 */
  brand: Record<string, any>;

  /** launchpad */
  launchpad: ModelSettings_launchpad;
}

export interface ModelSettings_launchpad {
  /** 列数 */
  columns?: number;

  /** 行数 */
  rows?: number;
}
