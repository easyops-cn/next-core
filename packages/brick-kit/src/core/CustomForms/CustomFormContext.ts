import { uniqueId } from "lodash";
import { RuntimeBrick } from "../BrickNode";
import { StoryboardContextWrapper } from "../StoryboardContext";

const FormContextMap = new Map<string, CustomFormContext>();

export class CustomFormContext {
  private variables: Record<string, unknown>;
  readonly formState: StoryboardContextWrapper;
  readonly id = uniqueId("form-ctx-");

  constructor(private brick: RuntimeBrick) {
    FormContextMap.set(this.id, this);
    this.formState = new StoryboardContextWrapper();
    brick.formContextId = this.id;
  }

  setVariables(variables: Record<string, unknown>): void {
    this.variables = variables;
    Object.freeze(variables);
  }

  getVariables(): Record<string, unknown> {
    const { element } = this.brick;
    if (element) {
      return Object.fromEntries(
        Object.keys(this.variables).map((prop) => [
          prop,
          (element as any)[prop],
        ])
      );
    }
    return this.variables;
  }

  getBrick(): RuntimeBrick {
    return this.brick;
  }
}

export function getCustomFormContext(formContextId: string): CustomFormContext {
  return FormContextMap.get(formContextId);
}
