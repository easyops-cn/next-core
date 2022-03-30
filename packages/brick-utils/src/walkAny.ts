const isObjectOrArray = (data: unknown): boolean => {
  return (
    Object.prototype.toString.call(data) === "[object Object]" ||
    Object.prototype.toString.call(data) === "[object Array]"
  );
};

export function walkAny(
  data: unknown,
  callback: (data: unknown) => void
): void {
  if (isObjectOrArray(data)) {
    const allKeys = Object.keys(data);
    for (let i = 0; i < allKeys.length; i++) {
      const item = (data as Record<string, unknown>)[allKeys[i]];
      if (isObjectOrArray(item)) {
        walkAny(item, callback);
      }
      callback([allKeys[i], item]);
    }
  } else {
    callback(data);
  }
}
