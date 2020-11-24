import { ObjectType } from "./internal";

const globalInterfaces = new Set<string>();

export class InternalInterfaces {
  private readonly interfaces: Map<string, ObjectType> = new Map();
  private readonly usedInterfaces: Set<string> = new Set();
  private readonly reversedMap: WeakMap<ObjectType, string> = new WeakMap();

  markUsedInterface(interfaceName: string): void {
    this.usedInterfaces.add(interfaceName);
  }

  getInterfaceEntries(): [string, ObjectType][] {
    return Array.from(this.interfaces.entries());
  }

  createOne(type: ObjectType, guessName: string): string {
    const interfaceName = this.getName(guessName);
    globalInterfaces.add(interfaceName);
    this.interfaces.set(interfaceName, type);
    this.reversedMap.set(type, interfaceName);
    return interfaceName;
  }

  getName(guessName: string): string {
    let interfaceName = guessName;
    let counter = 1;
    while (
      globalInterfaces.has(interfaceName) ||
      this.usedInterfaces.has(interfaceName)
    ) {
      interfaceName = `${guessName}_${(counter += 1)}`;
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
