import { set } from "lodash";

interface ProviderElement<P extends any[], R> extends HTMLElement {
  args: P;

  updateArgs: (event: CustomEvent<Record<string, any>>) => void;

  updateArgsAndExecute: (event: CustomEvent<Record<string, any>>) => void;

  setArgs: (patch: Record<string, any>) => void;

  setArgsAndExecute: (patch: Record<string, any>) => void;

  execute(): Promise<void>;

  executeWithArgs(...args: P): Promise<void>;

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

    updateArgsAndExecute(event: CustomEvent<Record<string, any>>): void {
      this.updateArgs(event);
      this.execute();
    }

    setArgs(patch: Record<string, any>): void {
      for (const [path, value] of Object.entries(patch)) {
        set(this.args, path, value);
      }
    }

    setArgsAndExecute(patch: Record<string, any>): void {
      this.setArgs(patch);
      this.execute();
    }

    execute(): Promise<void> {
      return this.executeWithArgs(...this.args);
    }

    async executeWithArgs(...args: Parameters<typeof api>): Promise<void> {
      try {
        const result = await api(...args);
        this.dispatchEvent(
          new CustomEvent("response.success", {
            detail: result
          })
        );
      } catch (error) {
        this.dispatchEvent(
          new CustomEvent("response.error", {
            detail: error
          })
        );
      }
    }

    resolve(...args: Parameters<typeof api>): ReturnType<typeof api> {
      return api(...args);
    }
  };
}
