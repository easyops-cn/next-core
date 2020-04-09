import { set } from "lodash";
import { saveAs } from "file-saver";

interface ProviderElement<P extends any[], R> extends HTMLElement {
  args: P;

  updateArgs: (event: CustomEvent<Record<string, any>>) => void;

  updateArgsAndExecute: (event: CustomEvent<Record<string, any>>) => R;

  setArgs: (patch: Record<string, any>) => void;

  setArgsAndExecute: (patch: Record<string, any>) => R;

  execute(): R;

  executeWithArgs(...args: P): R;

  saveAs(filename: string, ...args: P): R;

  resolve(...args: P): R;
}

export function createProviderClass(
  api: (...args: any) => Promise<any>
): { new (): ProviderElement<Parameters<typeof api>, ReturnType<typeof api>> } {
  return class extends HTMLElement {
    args: Parameters<typeof api> = [] as any;

    updateArgs(event: CustomEvent<Record<string, any>>): void {
      if (!(event instanceof CustomEvent)) {
        // eslint-disable-next-line no-console
        console.warn(
          "`updateArgs/updateArgsAndExecute` is designed to receive an CustomEvent, if not, please use `setArgs/setArgsAndExecute` instead."
        );
      }
      this.setArgs(event.detail);
    }

    updateArgsAndExecute(
      event: CustomEvent<Record<string, any>>
    ): ReturnType<typeof api> {
      this.updateArgs(event);
      return this.execute();
    }

    setArgs(patch: Record<string, any>): void {
      for (const [path, value] of Object.entries(patch)) {
        set(this.args, path, value);
      }
    }

    setArgsAndExecute(patch: Record<string, any>): ReturnType<typeof api> {
      this.setArgs(patch);
      return this.execute();
    }

    execute(): ReturnType<typeof api> {
      return this.executeWithArgs(...this.args);
    }

    async saveAs(
      filename: string,
      ...args: Parameters<typeof api>
    ): Promise<void> {
      const blob = await api(...args);
      saveAs(blob, filename);
    }

    async executeWithArgs(
      ...args: Parameters<typeof api>
    ): ReturnType<typeof api> {
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

    resolve(...args: Parameters<typeof api>): ReturnType<typeof api> {
      return api(...args);
    }
  };
}
