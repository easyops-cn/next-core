export function cmdbInstanceShowName(value: unknown): unknown {
  if (Array.isArray(value)) {
    const firstKey = value[0];
    const resKey = value.slice(1, value.length).join(",");
    const res = resKey ? `${firstKey}(${resKey})` : firstKey ?? "";
    return res;
  } else {
    return value;
  }
}
