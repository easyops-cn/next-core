import { EnumTypeDoc } from "../interface";

export class EnumType {
  constructor(private doc: EnumTypeDoc) {}

  toString(): string {
    return `(${(this.doc.enum as (string | number)[])
      .map(field => JSON.stringify(field))
      .join("|")})`;
  }
}
