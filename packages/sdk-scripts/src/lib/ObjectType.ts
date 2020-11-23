import os from "os";
import { SourceFile, MixedType } from "./internal";
import {
  ObjectTypeDoc,
  FieldDoc,
  RefFieldDoc,
  NormalFieldDoc,
} from "../interface";

export class ObjectType {
  private interfaceName: string;

  constructor(private sourceFile: SourceFile, private doc: ObjectTypeDoc) {
    this.interfaceName = this.sourceFile.internalInterfaces.createOne(this);
  }

  private fieldToString(field: FieldDoc): string {
    const { requireAll, required } = this.doc;
    const isRefFieldDoc = !!(field as RefFieldDoc).ref;
    let refModel: string;
    let refKey: string;
    if (isRefFieldDoc) {
      [refModel, refKey] = (field as RefFieldDoc).ref.split(".");
    }
    const isRequired =
      requireAll ||
      (Array.isArray(required) &&
        (isRefFieldDoc
          ? required.some(
              (r) => r === `${refModel}.*` || r === (field as RefFieldDoc).ref
            )
          : required.some((r) => r === (field as NormalFieldDoc).name)));
    if (isRefFieldDoc) {
      const ref = this.sourceFile.namespace.get(refModel);
      if (ref === undefined) {
        throw new Error(
          `Unknown model in ${this.sourceFile.filePath}: ${refModel}`
        );
      }
      field = ref.getRefField(refKey, this.sourceFile);
    }

    const normalField = field as NormalFieldDoc;
    return [
      `/** ${normalField.description} */${os.EOL}`,
      `${normalField.name}`,
      isRequired ? "" : "?",
      ":",
      this.fieldValueToString(normalField),
    ].join("");
  }

  private fieldValueToString(field: NormalFieldDoc): string {
    return new MixedType(this.sourceFile, {
      type: field.type,
      fields: field.fields,
      enum: field.enum,
    }).toString();
  }

  toString(): string {
    return this.interfaceName;
  }

  toDefinitionString(): string {
    return [
      "{",
      this.doc.fields
        .map((field) => this.fieldToString(field))
        .join(";" + os.EOL + os.EOL),
      "}",
    ].join(os.EOL);
  }
}
