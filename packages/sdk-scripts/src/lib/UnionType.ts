import { SimpleType } from "./internal";
import { ObjectType } from "./internal";

export class UnionType {
  private readonly unions = new Set<SimpleType>();
  spread(): SimpleType[] {
    return Array.from(this.unions.values());
  }
  protected addUnion(type: SimpleType): void {
    this.unions.add(type);
  }
  protected addUnions(types: SimpleType[]): void {
    types.forEach(type => {
      this.unions.add(type);
    });
  }
  shouldUseInterface(): boolean {
    return (
      this.unions.size === 1 &&
      Array.from(this.unions.values())[0] instanceof ObjectType
    );
  }
  withArray(isArray: boolean): string {
    let displayType = Array.from(this.unions)
      .map(t => t.toString())
      .join("&");
    if (isArray && this.unions.size > 1) {
      displayType = `(${displayType})`;
    }
    return displayType + (isArray ? "[]" : "");
  }
}
