/** BasicAuth认证配置 */
export interface ModelCustomAuthConfigBasicAuth {
  /** 用户名 */
  username: string;

  /** 密码，默认仅支持base64编码 */
  password: string;
}
