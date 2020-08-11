import { isNil } from "lodash";

export function json(value: string): unknown {
  if (isNil(value)) return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return;
  }
}
