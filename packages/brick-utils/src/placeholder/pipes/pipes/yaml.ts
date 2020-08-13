import { safeLoad, JSON_SCHEMA } from "js-yaml";

export function yaml(value: string): unknown {
  let result;
  try {
    result = safeLoad(value, { schema: JSON_SCHEMA, json: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
  return result;
}
