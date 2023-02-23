/** Launchpad配置 (兼容老Bootstrap接口数据结构) */
export interface ModelLaunchpadSettings {
  /** launchpad配置 */
  launchpad: ModelLaunchpadSettings_launchpad;
}

export interface ModelLaunchpadSettings_launchpad {
  /** 展示列数 */
  columns?: number;

  /** 展示行数 */
  rows?: number;
}
