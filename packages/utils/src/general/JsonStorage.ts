// This is copied from
// [@next-libs/storage](https://github.com/easyops-cn/next-libs/tree/master/libs/storage),
// and the types is refined.
// The usage of JsonStorage from @next-libs/storage should be deprecated,
// and migrated to from @next-core/brick-utils.
export class JsonStorage<U = Record<string, unknown>> {
  constructor(
    private storage: Storage,
    private prefix: string = "brick-next-"
  ) {}

  setItem<T extends string & keyof U>(name: T, value: U[T]): void {
    this.storage.setItem(this.prefix + name, JSON.stringify(value));
  }

  getItem<T extends string & keyof U>(name: T): U[T] {
    return JSON.parse(
      this.storage.getItem(this.prefix + name) ?? "null"
    ) as U[T];
  }

  removeItem<T extends string & keyof U>(name: T): void {
    return this.storage.removeItem(this.prefix + name);
  }

  clear(): void {
    return this.storage.clear();
  }
}
