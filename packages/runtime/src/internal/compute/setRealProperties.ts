export function setRealProperties(
  brick: HTMLElement,
  realProps: Record<string, unknown> | undefined
): void {
  if (!realProps) {
    return;
  }
  for (const [propName, propValue] of Object.entries(realProps)) {
    switch (propName) {
      case "style":
      case "dataset":
        for (const [k, v] of Object.entries(
          propValue as Record<string, unknown>
        )) {
          (brick[propName] as unknown as Record<string, unknown>)[k] = v;
        }
        break;
      case "constructor":
      case "__proto__":
      case "innerHTML":
        // `innerHTML` is dangerous, use `textContent` instead.
        throw new Error(`set \`${propName}\` is prohibited`);
      default:
        (brick as unknown as Record<string, unknown>)[propName] = propValue;
    }
  }
}
