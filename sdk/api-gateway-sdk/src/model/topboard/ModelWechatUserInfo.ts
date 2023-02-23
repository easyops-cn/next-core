/** 微信用户信息 */
export interface ModelWechatUserInfo {
  /** 用户名称 */
  name: string;

  /** 用户头像url */
  userIcon: string;

  /** 电话 */
  telephone: string;

  /** 微信平台统一账号unionId */
  unionId: string;

  /** 想法小程序openId */
  ideaMiniProgramOpenId: string;

  /** 想法公众号openId */
  ideaOfficialAccountOpenId: string;

  /** 省份 */
  province: string;

  /** 城市 */
  city: string;

  /** 国家 */
  country: string;

  /** 性别 值为1时是男性，值为2时是女性，值为0时是未知 */
  sex: number;
}
