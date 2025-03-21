import * as changeCase from "change-case";
import chalk from "chalk";
import {
  SourceFile,
  ApiMethod,
  Context,
  TypeDefinition,
  FunctionBlock,
} from "./internal";
import { ApiDoc } from "../interface";
import { refineRequest } from "../utils";

export class Api extends SourceFile {
  readonly doc: ApiDoc;
  readonly originalName: string;
  readonly exportName: string;
  readonly filename: string;
  readonly modelSeg: string;
  readonly method: ApiMethod;
  readonly serviceName: string;
  readonly contractName: string;

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
    this.filename = changeCase.camelCase(doc.name);
    const exportPrefix = `${changeCase.pascalCase(modelSeg)}Api_`;
    this.exportName = `${exportPrefix}${this.filename}`;
    this.modelSeg = modelSeg;
    this.dir = [".", "api", context.serviceSeg, modelSeg].join("/");
    this.filePath = [this.dir, this.filename].join("/");
    this.contractName = [context.serviceSeg, modelSeg, this.originalName].join(
      "."
    );
    this.serviceName = this.doc.service_name || this.contractName;
    this.method = new ApiMethod(doc);
    this.namespace = this.getNamespaceByImports(doc.import, context);
    const interfacePrefix = `${exportPrefix}${changeCase.pascalCase(doc.name)}`;

    const { requestParams, requestBody } = refineRequest(this);
    this.requestParamsType = new TypeDefinition(
      this,
      requestParams,
      `${interfacePrefix}RequestParams`
    );
    this.requestBodyType = new TypeDefinition(
      this,
      requestBody,
      `${interfacePrefix}RequestBody`
    );

    this.responseBodyTypeName = doc.response
      ? interfacePrefix + "ResponseBody"
      : "void";
    this.responseWrapper = doc.response
      ? doc.response.wrapper !== false
      : false;
    if (this.method.isSugar) {
      const responseItemTypeName = interfacePrefix + "ResponseItem";
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
    try {
      // Generate main block string before imports,
      // Because imports could be manipulated when main block generating.
      const mainBlockString = this.joinBlocks([
        this.requestParamsType,
        this.requestBodyType,
        this.responseItemType,
        this.responseBodyType,
        this.functionBlock,
      ]);
      // And generate internal blocks string after main block generated,
      // Because internal blocks could be manipulated when main block generating.
      const internalBlocksString = this.joinBlocks(
        this.getInternalInterfaceBlocks()
      );
      return this.joinBlocks([
        this.importsToString(),
        mainBlockString,
        internalBlocksString,
      ]);
    } catch (error) {
      console.log(
        chalk.red("Generating sdk failed for contract of api:"),
        chalk.bgRed(this.contractName)
      );
      throw error;
    }
  }
}
