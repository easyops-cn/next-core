import { set } from "lodash";

interface ProviderElement<P extends any[], R> extends HTMLElement {
  args: P;

  updateArgs: (event: CustomEvent<Record<string, any>>) => void;

  updateArgsAndExecute: (event: CustomEvent<Record<string, any>>) => void;

  execute(): R;

  resolve(...args: P): R;
}

export function createProviderClass(
  api: (...args: any) => Promise<any>
): { new (): ProviderElement<Parameters<typeof api>, ReturnType<typeof api>> } {
  return class extends HTMLElement {
    args: Parameters<typeof api> = [] as any;

    updateArgs(event: CustomEvent<Record<string, any>>): void {
      for (const [path, value] of Object.entries(event.detail)) {
        set(this.args, path, value);
      }
    }

    updateArgsAndExecute(event: CustomEvent<Record<string, any>>): void {
      this.updateArgs(event);
      this.execute();
    }

    async execute(): ReturnType<typeof api> {
      try {
        const result = await api(...this.args);
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
