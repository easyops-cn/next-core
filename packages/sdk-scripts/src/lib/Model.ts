import * as changeCase from "change-case";
import { SourceFile } from "./internal";
import { ModelDoc } from "../interface";
import { TypeDefinition } from "./internal";
import { Context } from "./internal";

export class Model extends SourceFile {
  readonly doc: ModelDoc;
  readonly originalName: string;
  readonly displayName: string;
  readonly modelSeg: string;
  readonly typeBlock: TypeDefinition;

  constructor(
    doc: ModelDoc,
    context: Context,
    serviceSeg: string,
    modelSeg: string
  ) {
    super(context);
    this.doc = doc;
    this.originalName = doc.name;
    this.displayName = "Model" + changeCase.pascalCase(doc.name);
    this.modelSeg = modelSeg;
    this.dir = [".", "model", serviceSeg].join("/");
    this.filePath = [this.dir, this.displayName].join("/");
    this.namespace = this.getNamespaceByImports(doc.import, context);
    this.typeBlock = new TypeDefinition(
      this,
      { ...doc, type: "object", requireAll: true },
      this.displayName
    );
  }

  toString(): string {
    // Generate main block string before imports,
    // Because imports could be manipulated when main block generating.
    const mainBlockString = this.typeBlock.toString();
    return this.joinBlocks([this.importsToString(), mainBlockString]);
  }
}
