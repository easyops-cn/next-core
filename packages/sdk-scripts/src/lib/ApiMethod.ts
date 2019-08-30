import { ApiDoc } from "../interface";

export class ApiMethod {
  static complexMethods = ["post", "put", "patch"];
  static sugarMethodMap = new Map([["list", "get"]]);

  isComplex: boolean;
  isSugar: boolean;
  lowerName: string;
  realName: string;

  constructor(doc: ApiDoc) {
    this.lowerName = doc.endpoint.method.toLowerCase();
    this.isComplex = ApiMethod.complexMethods.includes(this.lowerName);
    this.isSugar = ApiMethod.sugarMethodMap.has(this.lowerName);
    this.realName = this.isSugar
      ? ApiMethod.sugarMethodMap.get(this.lowerName)
      : this.lowerName;
  }
}
