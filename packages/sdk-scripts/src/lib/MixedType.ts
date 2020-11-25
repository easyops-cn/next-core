import {
  UnionType,
  SourceFile,
  ProbablyObjectType,
  PartialModelType,
  EnumType,
  TypePath,
} from "./internal";
import { MixedTypeDoc } from "../interface";
import { isPrimitiveType, getRealType, isPropertyType } from "../utils";

export class MixedType extends UnionType {
  readonly isArray: boolean;

  constructor(sourceFile: SourceFile, doc: MixedTypeDoc, typePath: TypePath) {
    super(sourceFile);
    const { fields, required, requireAll } = doc;
    const { type, isArray, enum: enumValues } = getRealType(doc);
    this.isArray = isArray;

    const typePathWithArray = isArray ? typePath.concat("item") : typePath;

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
        new ProbablyObjectType(
          sourceFile,
          {
            fields,
            required,
            requireAll,
          },
          typePathWithArray
        ).spread()
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

  toDefinitionStringWithName(name: string): string {
    return this.generateInterfaceDefinitionOrTypeAlias(name, this.isArray);
  }

  toString(): string {
    return this.withArray(this.isArray);
  }
}
