import {
  UnionType,
  SourceFile,
  ObjectType,
  PartialModelType,
  TypePath,
} from "./internal";
import { ObjectTypeDoc, RefFieldDoc } from "../interface";

export class ProbablyObjectType extends UnionType {
  constructor(sourceFile: SourceFile, doc: ObjectTypeDoc, typePath: TypePath) {
    super(sourceFile);
    const globFields = doc.fields.filter(
      (f) => (f as RefFieldDoc).ref && (f as RefFieldDoc).ref.endsWith(".*")
    );
    const plainFields = doc.fields.filter((f) => !globFields.includes(f));
    const unionTypes = globFields.map((f) =>
      (f as RefFieldDoc).ref.replace(".*", "")
    );

    unionTypes.forEach((type) => {
      this.addUnions(
        new PartialModelType(sourceFile, {
          type,
          required: doc.required,
          requireAll: doc.requireAll,
        }).spread()
      );
    });

    if (plainFields.length > 0) {
      this.addUnion(
        new ObjectType(
          sourceFile,
          {
            fields: plainFields,
            required: doc.required,
            requireAll: doc.requireAll,
          },
          typePath
        )
      );
    }
  }
}
