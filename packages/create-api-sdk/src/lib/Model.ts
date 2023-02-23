import * as changeCase from "change-case";
import chalk from "chalk";
import { SourceFile, Context, TypeDefinition } from "./internal.js";
import { ModelDoc, NormalFieldDoc, RefFieldDoc } from "../interface.js";
import { isPrimitiveType, getRealType } from "../utils.js";

export class Model extends SourceFile {
  readonly doc: ModelDoc;
  readonly originalName: string;
  readonly displayName: string;
  readonly modelSeg: string;
  readonly typeBlock: TypeDefinition;
  readonly modelPath: string;

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
    this.modelPath = [serviceSeg, modelSeg, this.originalName].join("/");
    this.typeBlock = new TypeDefinition(
      this,
      { ...doc, type: "object", requireAll: true },
      this.displayName
    );
  }

  getRefField(
    refKey: string,
    originalSourceFile: SourceFile,
    justTry?: boolean
  ): NormalFieldDoc {
    let possibleField: NormalFieldDoc;
    for (const f of this.doc.fields) {
      if ((f as RefFieldDoc).ref) {
        const [refModel, key] = (f as RefFieldDoc).ref.split(".");
        if (key === "*") {
          const ref = this.namespace.get(refModel);
          if (ref === undefined) {
            throw new Error(`Unknown model in ${this.filePath}: ${refModel}`);
          }
          possibleField = ref.getRefField(refKey, originalSourceFile, true);
          if (possibleField) {
            return possibleField;
          }
        }
      }
    }

    const field = this.doc.fields.find((f) =>
      (f as RefFieldDoc).ref
        ? (f as RefFieldDoc).ref.split(".")[1] === refKey
        : (f as NormalFieldDoc).name === refKey
    );
    if (field === undefined) {
      if (justTry) {
        return null;
      }
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
      type: `${this.displayName}["${refKey}"]`,
    };
  }

  toString(): string {
    try {
      // Generate main block string before imports,
      // Because imports could be manipulated when main block generating.
      const mainBlockString = this.typeBlock.toString();
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
        chalk.red("Generating sdk failed for contract of model:"),
        chalk.bgRed(this.modelPath)
      );
      throw error;
    }
  }
}
