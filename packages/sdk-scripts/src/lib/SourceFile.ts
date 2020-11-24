import path from "path";
import os from "os";
import {
  Context,
  FileImports,
  Model,
  InternalInterfaces,
  ObjectType,
} from "./internal";
import { loadModel } from "../loaders/loadModel";

type SourceBlock =
  | string
  | {
      toString(): string;
    };

export class SourceFile {
  dir: string;
  filePath: string;
  readonly context: Context;
  readonly imports: FileImports = new FileImports();
  namespace: Map<string, Model>;
  readonly internalInterfaces = new InternalInterfaces();

  constructor(context: Context) {
    this.context = context;
  }

  importsToString(): string {
    return this.imports
      .toArray()
      .map(([from, ports]) => {
        let relative = from;
        if (from.startsWith("./")) {
          relative = path.relative(this.dir, from);
          if (relative === "") {
            relative = ".";
          } else if (!/^\.?\.\//.test(relative)) {
            relative = "./" + relative;
          }
        }
        return {
          ports,
          from: relative,
        };
      })
      .sort((a, b) => {
        // Make packages of node_modules import first.
        const ax = Number(a.from.startsWith("."));
        const bx = Number(b.from.startsWith("."));
        const dx = ax - bx;
        if (dx !== 0) {
          return dx;
        }
        // Imports are unique of from
        return a.from > b.from ? 1 : -1;
      })
      .map(
        ({ ports, from }: { ports: string[]; from: string }) =>
          `import { ${ports.join(",")} } from "${from}";`
      )
      .join(os.EOL);
  }

  joinBlocks(blocks: SourceBlock[], sep: string = os.EOL + os.EOL): string {
    return blocks
      .map((b) => (b ? (typeof b === "string" ? b : b.toString()) : false))
      .filter((b) => b)
      .join(sep);
  }

  getNamespaceByImports(
    imports: string[],
    context: Context
  ): Map<string, Model> {
    const namespace = new Map();
    if (Array.isArray(imports)) {
      imports.forEach((port) => {
        const segments = port.split("/");
        const [orgSeg, categorySeg, serviceSeg, modelSeg] = segments;
        if (
          segments.length !== 4 ||
          orgSeg !== "easyops" ||
          categorySeg !== "model"
        ) {
          throw new Error(`Unknown import: ${port}`);
        }

        const model = loadModel(context, serviceSeg, modelSeg);
        namespace.set(model.originalName, model);
      });
    }
    return namespace;
  }

  getInternalInterfaceBlocks(): SourceBlock[] {
    let entries: [string, ObjectType][];
    let blocks = [] as SourceBlock[];
    while ((entries = this.internalInterfaces.getInterfaceEntries())) {
      blocks = blocks.concat(
        entries.map(
          ([interfaceName, objectType]) =>
            `export interface ${interfaceName} ${objectType.toDefinitionString()}`
        )
      );
    }
    return blocks;
  }
}
