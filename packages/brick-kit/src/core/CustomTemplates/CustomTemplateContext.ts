import { uniqueId } from "lodash";
import { RuntimeBrick } from "../BrickNode";

export class CustomTemplateContext {
  private contextMap = new Map<string, Record<string, unknown>>();
  private brickMap = new Map<string, RuntimeBrick>();
  private propsMap = new Map<string, string[]>();

  createContext(): string {
    return uniqueId("tpl-ctx-");
  }

  sealContext(
    id: string,
    value: Record<string, unknown>,
    brick: RuntimeBrick
  ): void {
    Object.freeze(value);
    this.contextMap.set(id, value);
    this.brickMap.set(id, brick);
    this.propsMap.set(id, Object.keys(value));
  }

  getContext(id: string): Record<string, unknown> {
    const brick = this.brickMap.get(id);
    if (brick.element) {
      const props = this.propsMap.get(id);
      return Object.fromEntries(
        props.map((prop) => [prop, (brick.element as any)[prop]])
      );
    }
    return this.contextMap.get(id);
  }
}
