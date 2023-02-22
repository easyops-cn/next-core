/** OAuth2.0认证配置 */
export interface ModelCustomAuthConfigOAuth2 {
  /** token请求URL */
  accessTokenUrl: string;

  /** token请求方法 */
  accessTokenMethod: string;

  /** token请求头，支持多个kv */
  accessTokenHeader: Record<string, any>[];

  /** token请求参数，支持多个kv */
  accessTokenParams: Record<string, any>[];

  /** token、Json请求体 */
  accessTokenBodyJson: any;

  /** token、Encoded请求体 */
  accessTokenBodyUrlEncoded: Record<string, any>[];

  /** token请求体类型 */
  accessTokenBodyType: "none" | "x-www-form-urlencoded" | "json";

  /** token过期时间 */
  expireTime: number;

  /** token值的jsonPath，默认取$access_token */
  accessTokenJsonPath: string;
}
