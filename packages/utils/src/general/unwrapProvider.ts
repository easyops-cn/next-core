const pool = new Map<string, HTMLElement>();

function getProviderBrick(provider: string) {
  let brick = pool.get(provider);
  if (brick) {
    return brick;
  }
  brick = document.createElement(provider);
  pool.set(provider, brick);
  return brick;
}

export function unwrapProvider<T extends (...args: any[]) => any>(
  provider: string
): (...args: Parameters<T>) => ReturnType<T> {
  return function (...args: Parameters<T>): ReturnType<T> {
    const brick = getProviderBrick(provider) as unknown as {
      resolve(...args: Parameters<T>): ReturnType<T>;
    };
    return brick.resolve(...args);
  };
}
