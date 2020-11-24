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

  constructor(sourceFile: SourceFile, doc: MixedTypeDoc, guessName: string) {
    super(sourceFile);
    const { fields, required, requireAll } = doc;
    const { type, isArray, enum: enumValues } = getRealType(doc);
    this.isArray = isArray;

    const guessNameWithArray = isArray ? `${guessName}_item` : guessName;

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
          guessNameWithArray
        ).spread()
      );
      return;
    }

    this.addUnions(
      new PartialModelType(
        sourceFile,
        {
          type,
          required,
          requireAll,
        },
        guessNameWithArray
      ).spread()
    );
  }

  withName(name: string): string {
    const definition = !this.isArray && this.generateDefinitionIfAvailable();
    if (definition) {
      return `interface ${name} ${definition};`;
    }
    return `type ${name} = ${this.toString()};`;
  }

  toString(): string {
    return this.withArray(this.isArray);
  }
}
