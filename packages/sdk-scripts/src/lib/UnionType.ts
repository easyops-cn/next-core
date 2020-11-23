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

  getObjectTypeIfAvailable(): ObjectType {
    if (this.unions.size === 1) {
      const type = Array.from(this.unions.values())[0];
      if (type instanceof ObjectType) {
        return type;
      }
    }
  }

  generateDefinitionIfAvailable(): string {
    if (this.unions.size === 1) {
      const type = Array.from(this.unions.values())[0];
      if (type instanceof ObjectType) {
        const { interfaces, reversedMap } = this.sourceFile.internalInterfaces;
        if (reversedMap.has(type)) {
          const interfaceName = reversedMap.get(type);
          interfaces.delete(interfaceName);
          reversedMap.delete(type);
        }
        return type.toDefinitionString();
      }
    }
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
