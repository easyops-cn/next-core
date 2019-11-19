// 因 jest 引入 document-register-element 后，文档中的 Element 对象的 constructor 变成了 CustomElementsV1，这里将该类型的 serialize 重新指回 pretty-format 的 DOMElement.serialize，以便正常序列化
import { plugins } from "pretty-format";

export const test = (val: any) =>
  val &&
  val.constructor &&
  val.constructor.name &&
  val.constructor.name === "CustomElementsV1";
export const serialize = plugins.DOMElement.serialize;
