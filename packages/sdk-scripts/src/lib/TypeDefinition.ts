import os from "os";
import { MixedType, SourceFile } from "./internal";
import { BaseDoc, NormalFieldDoc } from "../interface";

export class TypeDefinition {
  readonly value: MixedType;
  readonly name: string;
  readonly isFormData: boolean;
  readonly isFile: boolean;

  constructor(sourceFile: SourceFile, private doc: BaseDoc, name: string) {
    this.name = name;
    this.isFormData = false;
    this.isFile = false;
    sourceFile.internalInterfaces.markUsedInterface(name);
    if (doc) {
      this.value = new MixedType(sourceFile, doc, name);
      if (
        doc.type === "object" &&
        doc.fields.some((f) =>
          ["file", "file[]"].includes((f as NormalFieldDoc).type)
        )
      ) {
        this.isFormData = true;
      } else if (doc.type === "file") {
        this.isFile = true;
      }
    }
  }

  toString(): string {
    if (!this.doc || this.isFile) {
      return "";
    }
    let content = `export ${this.value.withName(this.name)}`;
    if (this.doc.description) {
      content = `/** ${this.doc.description} */${os.EOL}${content}`;
    }
    return content;
  }
}
