import fileSaver from "file-saver";

interface ProviderElement<T extends unknown[], U> extends HTMLElement {
  resolve(...args: T): U;
  saveAs(filename: string, ...args: T): Promise<void>;
}

interface ProviderConstructor<T extends unknown[], U> {
  new (): ProviderElement<T, U>;
}

export function createProviderClass<T extends unknown[], U>(
  api: (...args: T) => U
): ProviderConstructor<T, U> {
  return class extends HTMLElement {
    get $$typeof(): string {
      return "provider";
    }

    resolve(...args: T): U {
      return api(...args);
    }

    async saveAs(filename: string, ...args: T): Promise<void> {
      const blob = await api(...args);
      fileSaver.saveAs(blob as unknown as Blob, filename);
    }
  };
}
