import { ObjectType, TypePath, TypeDefinition, Model } from "./internal";

const globalInterfaces = new Set<string>();

// istanbul ignore next
export function clearGlobalInterfaces(): void {
  globalInterfaces.clear();
}

/**
 * Help to manage internal interfaces in a source file.
 */
export class InternalInterfaces {
  private readonly interfaces: Map<string, ObjectType> = new Map();
  private readonly usedInterfaces: Set<string> = new Set();
  private reversedMap: WeakMap<ObjectType, string> = new WeakMap();

  markUsedInterface(interfaceName: string): void {
    this.usedInterfaces.add(interfaceName);
  }

  getInterfaceEntries(): [string, ObjectType][] {
    const entries = Array.from(this.interfaces.entries());
    if (entries.length === 0) {
      return null;
    }
    this.interfaces.clear();
    return entries;
  }

  createOne(type: ObjectType, typePath: TypePath): string {
    const interfaceName = this.generateName(typePath);
    globalInterfaces.add(interfaceName);
    this.interfaces.set(interfaceName, type);
    this.reversedMap.set(type, interfaceName);
    return interfaceName;
  }

  private generateName(typePath: TypePath): string {
    const baseName = typePath
      .map((type) => {
        if (typeof type === "string") {
          return type;
        }
        if (type instanceof TypeDefinition) {
          return type.name;
        }
        // istanbul ignore else: should never reach.
        if (type instanceof Model) {
          return type.displayName;
        }
        // istanbul ignore next: should never reach.
        throw new Error(`Unexpected type in path ${type}`);
      })
      .join("_");
    let interfaceName = baseName;
    let counter = 1;
    while (
      globalInterfaces.has(interfaceName) ||
      this.usedInterfaces.has(interfaceName)
    ) {
      interfaceName = `${baseName}_${(counter += 1)}`;
    }
    return interfaceName;
  }

  removeOne(type: ObjectType): void {
    if (this.reversedMap.has(type)) {
      const interfaceName = this.reversedMap.get(type);
      this.interfaces.delete(interfaceName);
      this.reversedMap.delete(type);
      globalInterfaces.delete(interfaceName);
    }
  }
}
