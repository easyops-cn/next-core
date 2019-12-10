import * as changeCase from "change-case";
import { SourceFile, Context, TypeDefinition } from "./internal";
import { ModelDoc, NormalFieldDoc, RefFieldDoc } from "../interface";
import { isPrimitiveType, getRealType } from "../utils";

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

  getRefField(refKey: string, originalSourceFile: SourceFile): NormalFieldDoc {
    const field = this.doc.fields.find(f =>
      (f as RefFieldDoc).ref
        ? (f as RefFieldDoc).ref.split(".")[1] === refKey
        : (f as NormalFieldDoc).name === refKey
    );
    if (field === undefined) {
      throw new Error(`Field not found in ${this.filePath}: ${refKey}`);
    }

    const isRefFieldDoc = !!(field as RefFieldDoc).ref;

    if (isRefFieldDoc) {
      const refModel = (field as RefFieldDoc).ref.split(".")[0];
      const ref = this.namespace.get(refModel);
      if (ref === undefined) {
        throw new Error(`Unknown model in ${this.filePath}: ${refModel}`);
      }
      return ref.getRefField(refKey, originalSourceFile);
    }

    if (isPrimitiveType(getRealType(field as NormalFieldDoc).type)) {
      return field as NormalFieldDoc;
    }

    originalSourceFile.imports.addModel(this);
    return {
      ...(field as NormalFieldDoc),
      // It's a property type!
      type: `${this.displayName}["${refKey}"]`
    };
  }

  toString(): string {
    // Generate main block string before imports,
    // Because imports could be manipulated when main block generating.
    const mainBlockString = this.typeBlock.toString();
    return this.joinBlocks([this.importsToString(), mainBlockString]);
  }
}
