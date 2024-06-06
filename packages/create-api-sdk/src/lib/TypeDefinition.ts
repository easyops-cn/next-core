import os from "node:os";
import { MixedType, SourceFile, Model } from "./internal.js";
import { BaseDoc } from "../interface.js";
import { blockComment } from "./blockComment.js";

export type TypePathItem = TypeDefinition | Model | string;
export type TypePath = TypePathItem[];

export class TypeDefinition {
  readonly value: MixedType;
  readonly name: string;
  readonly isFormData: boolean;
  readonly isFile: boolean;

  constructor(
    sourceFile: SourceFile,
    private doc: BaseDoc,
    name: string
  ) {
    this.name = name;
    this.isFormData = false;
    this.isFile = false;
    sourceFile.internalInterfaces.markUsedInterface(name);
    if (doc) {
      this.value = new MixedType(sourceFile, doc, [this]);
      if (this.value.containsFileField()) {
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
    let content = `export ${this.value.toDefinitionStringWithName(this.name)}`;
    if (this.doc.description) {
      content = `${blockComment(this.doc.description)}${os.EOL}${content}`;
    }
    return content;
  }
}
