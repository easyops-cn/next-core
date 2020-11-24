import { UnionType, Model, SourceFile, MixedType } from "./internal";
import { PartialModelTypeDoc } from "../interface";

export class PartialModelType extends UnionType {
  private model: Model;
  private requireAll: boolean;

  constructor(
    sourceFile: SourceFile,
    doc: PartialModelTypeDoc,
    guessName: string
  ) {
    super(sourceFile);
    this.model = sourceFile.namespace.get(doc.type);
    if (this.model === undefined) {
      if (sourceFile instanceof Model && doc.type === sourceFile.originalName) {
        this.model = sourceFile;
      }
    } else {
      sourceFile.imports.addModel(this.model);
    }
    if (this.model === undefined) {
      throw new Error(`Unknown type in ${sourceFile.filePath}: ${doc.type}`);
    }
    this.requireAll =
      doc.requireAll ||
      (Array.isArray(doc.required) && doc.required.includes(`${doc.type}.*`));
    this.addUnion(this.getTypeName());
    if (!this.requireAll && Array.isArray(doc.required)) {
      const extraFields = doc.required
        .filter((r) => r.split(".")[0] === doc.type)
        .map((ref) => ({ ref }));
      if (extraFields.length > 0) {
        this.addUnions(
          new MixedType(
            sourceFile,
            {
              type: "object",
              fields: extraFields,
              requireAll: true,
            },
            guessName
          ).spread()
        );
      }
    }
  }

  getTypeName(): string {
    if (this.requireAll) {
      return this.model.displayName;
    }
    return `Partial<${this.model.displayName}>`;
  }
}
