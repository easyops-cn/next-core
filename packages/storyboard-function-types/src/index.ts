import { importLib, allLibs } from "./generated";
import { DeclarationFile } from "./interfaces";

export async function getTypeDeclarations(
  libs: true | string[]
): Promise<DeclarationFile[]> {
  return (
    await Promise.all((libs === true ? allLibs : libs).map(importLib))
  ).flat();
}
