import { ObjectType } from "./internal";

let counter = 0;

export class InternalInterfaces {
  readonly interfaces: Map<string, ObjectType> = new Map();
  readonly reversedMap: WeakMap<ObjectType, string> = new WeakMap();

  createOne(type: ObjectType): string {
    const interfaceName = `AnonymousInterface_${(counter += 1)}`;
    this.interfaces.set(interfaceName, type);
    this.reversedMap.set(type, interfaceName);
    return interfaceName;
  }
}
