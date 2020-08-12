export function jsonStringify(value: unknown, indent = 2): string {
  try {
    return JSON.stringify(value, null, indent);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return;
  }
}
