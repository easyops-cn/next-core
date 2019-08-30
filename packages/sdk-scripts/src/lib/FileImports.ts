import { Model } from "./internal";

export class FileImports {
  private imports = new Map<string, Set<string>>();

  addModel(model: Model): void {
    this.add(model.displayName, model.dir);
  }

  add(port: string | string[], from: string): void {
    let ports: Set<string>;
    if (!this.imports.has(from)) {
      ports = new Set<string>();
      this.imports.set(from, ports);
    } else {
      ports = this.imports.get(from);
    }
    [].concat(port).forEach(p => ports.add(p));
  }

  toArray(): [string, string[]][] {
    return Array.from(this.imports.entries()).map(([from, ports]) => [
      from,
      Array.from(ports.values())
    ]);
  }
}
