let injected = new WeakSet();

export function rememberInjected(object: any): void {
  injected.add(object);
}

export function haveBeenInjected(object: any): boolean {
  return injected.has(object);
}

export function resetAllInjected(): void {
  injected = new WeakSet();
}
