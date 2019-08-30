import changeCase from "change-case";
import { SourceFile } from "./internal";
import { ApiDoc } from "../interface";
import { ApiMethod } from "./internal";
import { Context } from "./internal";
import { TypeDefinition } from "./internal";
import { FunctionBlock } from "./internal";
import { refineRequest } from "../utils";

export class Api extends SourceFile {
  readonly doc: ApiDoc;
  readonly originalName: string;
  readonly displayName: string;
  readonly modelSeg: string;
  readonly method: ApiMethod;
  readonly serviceName: string;

  readonly requestParamsType: TypeDefinition;
  readonly requestBodyType: TypeDefinition;
  readonly responseBodyTypeName: string;
  readonly responseItemType: TypeDefinition | string;
  readonly responseBodyType: TypeDefinition | string;
  readonly responseWrapper: boolean;
  readonly functionBlock: FunctionBlock;

  constructor(doc: ApiDoc, context: Context, modelSeg: string) {
    super(context);
    this.doc = doc;
    this.originalName = doc.name;
    this.displayName = changeCase.camel(doc.name);
    this.modelSeg = modelSeg;
    this.dir = [".", "api", context.serviceSeg, modelSeg].join("/");
    this.filePath = [this.dir, this.displayName].join("/");
    this.serviceName = [context.serviceSeg, modelSeg, this.originalName].join(
      "."
    );
    this.method = new ApiMethod(doc);
    this.namespace = this.getNamespaceByImports(doc.import, context);
    const pascalName = changeCase.pascal(doc.name);

    const { requestParams, requestBody } = refineRequest(this);
    this.requestParamsType = new TypeDefinition(
      this,
      requestParams,
      `${pascalName}RequestParams`
    );
    this.requestBodyType = new TypeDefinition(
      this,
      requestBody,
      `${pascalName}RequestBody`
    );

    this.responseBodyTypeName = doc.response
      ? pascalName + "ResponseBody"
      : "void";
    this.responseWrapper = doc.response
      ? doc.response.wrapper !== false
      : false;
    if (this.method.isSugar) {
      const responseItemTypeName = pascalName + "ResponseItem";
      this.responseItemType = new TypeDefinition(
        this,
        doc.response,
        responseItemTypeName
      );
      this.responseBodyType = `export type ${this.responseBodyTypeName} = ResponseListWrapper<${responseItemTypeName}>;`;
    } else {
      this.responseBodyType = new TypeDefinition(
        this,
        doc.response,
        this.responseBodyTypeName
      );
    }
    this.functionBlock = new FunctionBlock(this);
  }

  toString(): string {
    // Generate main block string before imports,
    // Because imports could be manipulated when main block generating.
    const mainBlockString = this.joinBlocks([
      this.requestParamsType,
      this.requestBodyType,
      this.responseItemType,
      this.responseBodyType,
      this.functionBlock
    ]);
    return this.joinBlocks([this.importsToString(), mainBlockString]);
  }
}
