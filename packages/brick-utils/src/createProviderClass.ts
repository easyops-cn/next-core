import { set } from "lodash";
import { saveAs } from "file-saver";

interface ProviderElement<P extends unknown[], R> extends HTMLElement {
  args: P;

  updateArgs: (event: CustomEvent<Record<string, unknown>>) => void;

  updateArgsAndExecute: (
    event: CustomEvent<Record<string, unknown>>
  ) => Promise<R>;

  setArgs: (patch: Record<string, unknown>) => void;

  setArgsAndExecute: (patch: Record<string, unknown>) => Promise<R>;

  execute(): Promise<R>;

  executeWithArgs(...args: P): Promise<R>;

  saveAs(filename: string, ...args: P): Promise<void>;

  resolve(...args: P): R;
}

export function createProviderClass<T extends unknown[], U>(
  api: (...args: T) => U
): { new (): ProviderElement<T, U> } {
  return class extends HTMLElement {
    get $$typeof(): string {
      return "provider";
    }

    static get _dev_only_definedProperties(): string[] {
      return ["args"];
    }

    args = [] as T;

    updateArgs(event: CustomEvent<Record<string, unknown>>): void {
      if (!(event instanceof CustomEvent)) {
        // eslint-disable-next-line no-console
        console.warn(
          "`updateArgs/updateArgsAndExecute` is designed to receive an CustomEvent, if not, please use `setArgs/setArgsAndExecute` instead."
        );
      }
      this.setArgs(event.detail);
    }

    updateArgsAndExecute(
      event: CustomEvent<Record<string, unknown>>
    ): Promise<U> {
      this.updateArgs(event);
      return this.execute();
    }

    setArgs(patch: Record<string, unknown>): void {
      for (const [path, value] of Object.entries(patch)) {
        set(this.args, path, value);
      }
    }

    setArgsAndExecute(patch: Record<string, unknown>): Promise<U> {
      this.setArgs(patch);
      return this.execute();
    }

    execute(): Promise<U> {
      return this.executeWithArgs(...this.args);
    }

    async saveAs(filename: string, ...args: T): Promise<void> {
      const blob = await api(...args);
      saveAs((blob as unknown) as Blob, filename);
    }

    async executeWithArgs(...args: T): Promise<U> {
      try {
        const result = await api(...args);
        this.dispatchEvent(
          new CustomEvent("response.success", {
            detail: result,
          })
        );
        return result;
      } catch (error) {
        this.dispatchEvent(
          new CustomEvent("response.error", {
            detail: error,
          })
        );
        return Promise.reject(error);
      }
    }

    resolve(...args: T): U {
      return api(...args);
    }
  };
}
