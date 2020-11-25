import { SimpleType, ObjectType, SourceFile } from "./internal";

export class UnionType {
  private readonly unions = new Set<SimpleType>();

  constructor(private sourceFile: SourceFile) {}

  spread(): SimpleType[] {
    return Array.from(this.unions.values());
  }

  protected addUnion(type: SimpleType): void {
    this.unions.add(type);
  }

  protected addUnions(types: SimpleType[]): void {
    types.forEach((type) => {
      this.unions.add(type);
    });
  }

  /**
   * When generating a definition,
   * if the UnionType consists of a single `ObjectType`,
   * its interface definition should be used instead of type alias.
   */
  generateInterfaceDefinitionOrTypeAlias(
    name: string,
    isArray: boolean
  ): string {
    if (!isArray && this.unions.size === 1) {
      const type = Array.from(this.unions.values())[0];
      if (type instanceof ObjectType) {
        this.sourceFile.internalInterfaces.removeOne(type);
        return `interface ${name} ${type.toDefinitionString()}`;
      }
    }
    return `type ${name} = ${this.withArray(isArray)};`;
  }

  withArray(isArray: boolean): string {
    let displayType = Array.from(this.unions)
      .map((t) => t.toString())
      .join("&");
    if (isArray && this.unions.size > 1) {
      displayType = `(${displayType})`;
    }
    return displayType + (isArray ? "[]" : "");
  }
}
