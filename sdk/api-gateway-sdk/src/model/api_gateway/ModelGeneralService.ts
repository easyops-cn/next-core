/** 服务注册信息 */
export interface ModelGeneralService {
  /** 实例ID */
  instanceId: string;

  /** 服务名称 */
  name: string;

  /** 服务序号 */
  sequence: string;

  /** 服务分类 */
  category: string;

  /** 是否开放OpenAPI */
  isOpenAPI: boolean;

  /** 备注 */
  memo: string;

  /** 语言 */
  language: string;

  /** openapiPrefix前缀 */
  openapiPrefix: string;

  /** 核心服务 */
  isKeyService: boolean;

  /** 运行时 */
  runtime: string;
}
