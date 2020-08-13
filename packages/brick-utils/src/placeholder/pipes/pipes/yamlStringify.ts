import { safeDump, JSON_SCHEMA } from "js-yaml";

export function yamlStringify(value: unknown, indent = 2): string {
  let result;
  try {
    result = safeDump(value, {
      indent,
      schema: JSON_SCHEMA,
      skipInvalid: true,
      noRefs: true,
      noCompatMode: true,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
  return result;
}
