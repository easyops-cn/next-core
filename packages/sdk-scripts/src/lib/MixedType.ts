import { UnionType } from "./internal";
import { SourceFile } from "./internal";
import { MixedTypeDoc } from "../interface";
import { isPrimitiveType, getRealType, isPropertyType } from "../utils";
import { ProbablyObjectType } from "./internal";
import { PartialModelType } from "./internal";

export class MixedType extends UnionType {
  readonly isArray: boolean;

  constructor(sourceFile: SourceFile, doc: MixedTypeDoc) {
    super();
    const { fields, required, requireAll } = doc;
    const { type, isArray } = getRealType(doc.type);
    this.isArray = isArray;

    if (isPrimitiveType(type) || isPropertyType(type)) {
      this.addUnion(type);
      return;
    }

    if (type === "object") {
      this.addUnions(
        new ProbablyObjectType(sourceFile, {
          fields,
          required,
          requireAll
        }).spread()
      );
      return;
    }

    this.addUnions(
      new PartialModelType(sourceFile, {
        type,
        required,
        requireAll
      }).spread()
    );
  }

  withName(name: string): string {
    const useInterface = this.shouldUseInterface();
    if (useInterface) {
      return `interface ${name} ${this.toString()}`;
    }
    return `type ${name} = ${this.toString()};`;
  }

  toString(): string {
    return this.withArray(this.isArray);
  }
}
