import {
  UnionType,
  SourceFile,
  ProbablyObjectType,
  PartialModelType,
  EnumType,
} from "./internal";
import { MixedTypeDoc } from "../interface";
import { isPrimitiveType, getRealType, isPropertyType } from "../utils";

export class MixedType extends UnionType {
  readonly isArray: boolean;

  constructor(sourceFile: SourceFile, doc: MixedTypeDoc) {
    super();
    const { fields, required, requireAll } = doc;
    const { type, isArray, enum: enumValues } = getRealType(doc);
    this.isArray = isArray;

    if (Array.isArray(enumValues) && enumValues.length > 0) {
      if (!["string", "number", "boolean"].includes(type)) {
        throw new Error(`Unexpected enum for type: ${type}`);
      }
      this.addUnion(
        new EnumType({
          enum: enumValues,
        })
      );
      return;
    }

    if (isPrimitiveType(type) || isPropertyType(type)) {
      this.addUnion(type);
      return;
    }

    if (type === "object") {
      this.addUnions(
        new ProbablyObjectType(sourceFile, {
          fields,
          required,
          requireAll,
        }).spread()
      );
      return;
    }

    this.addUnions(
      new PartialModelType(sourceFile, {
        type,
        required,
        requireAll,
      }).spread()
    );
  }

  withName(name: string): string {
    const useInterface = !this.isArray && this.shouldUseInterface();
    if (useInterface) {
      return `interface ${name} ${this.toString()}`;
    }
    return `type ${name} = ${this.toString()};`;
  }

  toString(): string {
    return this.withArray(this.isArray);
  }
}
