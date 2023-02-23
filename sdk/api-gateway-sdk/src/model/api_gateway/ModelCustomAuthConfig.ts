import {
  ModelCustomAuthConfigOAuth2,
  ModelCustomAuthConfigBasicAuth,
  ModelCustomAuthConfigApiKey,
} from "./index.js";

/** 自定义认证配置 */
export interface ModelCustomAuthConfig {
  /** 实例ID */
  instanceId: string;

  /** 配置名称 */
  configName: string;

  /** 认证配置描述 */
  description: string;

  /** 认证类型 */
  authType: "basicAuth" | "oauth2" | "apiKey";

  /** 认证配置 */
  authConfig: ModelCustomAuthConfig_authConfig;
}

export interface ModelCustomAuthConfig_authConfig {
  /** 认证信息配置 */
  configPosition?: "header" | "body" | "params";

  /** 认证信息Key */
  configKey?: string;

  /** 认证信息Value前缀 */
  configValuePrefix?: string;

  /** 公共配置参数，用于参数替换 */
  configEnv?: Record<string, any>[];

  /** OAuth2认证配置 */
  oauth2?: Partial<ModelCustomAuthConfigOAuth2>;

  /** BasicAuth认证配置 */
  basicAuth?: Partial<ModelCustomAuthConfigBasicAuth>;

  /** APIKey认证配置 */
  apiKey?: Partial<ModelCustomAuthConfigApiKey>;
}
